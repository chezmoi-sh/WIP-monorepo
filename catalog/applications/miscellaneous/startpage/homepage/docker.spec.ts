import { randomUUID } from "crypto";
import { getRandomPort } from "get-port-please";
import tmp from "tmp";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";

import * as automation from "@pulumi/pulumi/automation";
import { ContainerPort } from "@pulumi/docker/types/output";
import { asset } from "@pulumi/pulumi";

import { DirectoryAsset } from "@chezmoi.sh/core/utils";

import { Homepage, Version } from "./docker";

const isIntegration = (process.env.VITEST_RUN_TYPE ?? "").includes("integration:docker");
const timeout = 2 * 60 * 1000; // 2 minutes

const HomepageImageTag = `${process.env.CI_OCI_REGISTRY ?? "oci.local.chezmoi.sh"}/miscellaneous/startpage/homepage:${Version}`;

describe.runIf(isIntegration)("(Miscellaneous/Startpage) Homepage", () => {
    describe("Homepage", () => {
        describe("when it is deployed", { timeout }, () => {
            // -- Prepare Pulumi execution --
            const program = async () => {
                const ports = {
                    http: await getRandomPort(),
                };
                const homepage = new Homepage(randomUUID(), {
                    public: new DirectoryAsset(`${__dirname}/fixtures/assets`).assets.reduce(
                        (acc, asset) => ({ ...acc, [asset.destination]: asset.source }),
                        {},
                    ),
                    configuration: {
                        bookmarks: new asset.FileAsset(`${__dirname}/fixtures/bookmarks.yaml`),
                        customCSS: new asset.FileAsset(`${__dirname}/fixtures/custom.css`),
                        customJS: new asset.FileAsset(`${__dirname}/fixtures/custom.js`),
                        services: new asset.FileAsset(`${__dirname}/fixtures/services.yaml`),
                        settings: new asset.FileAsset(`${__dirname}/fixtures/settings.yaml`),
                        widgets: new asset.FileAsset(`${__dirname}/fixtures/widgets.yaml`),
                    },

                    imageArgs: { push: true, tags: [HomepageImageTag] },
                    containerArgs: {
                        ports: [{ internal: 3000, external: ports.http, protocol: "tcp" }],
                        wait: true,
                    },
                });
                return { ...homepage.container };
            };

            let stack: automation.Stack;
            let result: automation.UpResult;
            beforeAll(async () => {
                const tmpdir = tmp.dirSync();
                stack = await automation.LocalWorkspace.createOrSelectStack(
                    {
                        stackName: "homepage",
                        projectName: "homepage",
                        program,
                    },
                    {
                        secretsProvider: "passphrase",
                        projectSettings: {
                            name: "homepage",
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
            it("should be locally accessible", async () => {
                const ports = result.outputs?.ports.value as ContainerPort[];
                const response = await fetch(`http://localhost:${ports[0].external}/`);

                expect(response.status).toBe(200);
            });
        });
    });
});
