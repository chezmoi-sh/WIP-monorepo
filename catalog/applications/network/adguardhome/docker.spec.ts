import * as dns from "dns/promises";
import { randomUUID } from "crypto";
import { getRandomPort } from "get-port-please";
import tmp from "tmp";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";

import * as automation from "@pulumi/pulumi/automation";
import { ContainerPort } from "@pulumi/docker/types/output";
import { asset } from "@pulumi/pulumi";

import { AlpineImage, Version as AlpineVersion } from "../../../os/alpine/3.19";
import { AdGuardHome, Version } from "./docker";

const isIntegration = (process.env.VITEST_RUN_TYPE ?? "").includes("integration:docker");
const timeout = 2 * 60 * 1000; // 2 minutes

const AlpineImageTag = `${process.env.CI_OCI_REGISTRY ?? "oci.local.chezmoi.sh"}/os/alpine:${AlpineVersion}`;
const AdGuardHomeImageTag = `${process.env.CI_OCI_REGISTRY ?? "oci.local.chezmoi.sh"}/network/adguardhome:${Version}`;

describe.runIf(isIntegration)("(Network) AdGuardHome", () => {
    describe("AdGuardHome", () => {
        describe("when it is deployed", { timeout }, () => {
            // -- Prepare Pulumi execution --
            const program = async () => {
                const ports = {
                    dns: await getRandomPort(),
                    http: await getRandomPort(),
                };
                const alpine = new AlpineImage(randomUUID(), { push: true, tags: [AlpineImageTag] });
                const adguardhome = new AdGuardHome(randomUUID(), {
                    configuration: new asset.FileAsset(`${__dirname}/fixtures/AdGuardHome.yaml`),

                    imageArgs: { push: true, tags: [AdGuardHomeImageTag], from: alpine },
                    containerArgs: {
                        ports: [
                            { internal: 3000, external: ports.http, protocol: "tcp" },
                            { internal: 3053, external: ports.dns, protocol: "udp" },
                        ],
                        wait: true,
                    },
                });
                return { ...adguardhome.container };
            };

            let stack: automation.Stack;
            let result: automation.UpResult;
            beforeAll(async () => {
                const tmpdir = tmp.dirSync();
                stack = await automation.LocalWorkspace.createOrSelectStack(
                    {
                        stackName: "adguardhome",
                        projectName: "adguardhome",
                        program,
                    },
                    {
                        secretsProvider: "passphrase",
                        projectSettings: {
                            name: "adguardhome",
                            runtime: "nodejs",
                            backend: {
                                url: `file://${tmpdir.name}`,
                            },
                        },
                    },
                );
                result = await stack.up();
            }, timeout);

            beforeEach(() => {
                expect(result.summary.result, "should be successfully deployed").toBe("succeeded");
            });

            afterAll(async () => {
                await stack.destroy();
            }, timeout);

            // -- Assertions --
            it("should be locally accessible", { concurrent: true }, async () => {
                const ports = result.outputs?.ports.value as ContainerPort[];
                const response = await fetch(`http://localhost:${ports[0].external}/`);

                expect(response.ok).toBeTruthy();
            });

            it("should be able to resolve DNS queries", { concurrent: true }, async () => {
                const ports = result.outputs?.ports.value as ContainerPort[];
                // NOTE: validate that current host is able to resolve DNS queries
                expect(await dns.resolve4("one.one.one.one")).toEqual(expect.arrayContaining(["1.1.1.1"]));

                const dnsBackup = dns.getServers();
                dns.setServers([`127.0.0.1:${ports[1].external}`]);
                expect(await dns.resolve4("one.one.one.one")).toEqual(expect.arrayContaining(["1.1.1.1"]));
                dns.setServers(dnsBackup);
            });
        });
    });
});
