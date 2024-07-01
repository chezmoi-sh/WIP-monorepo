import { randomUUID } from "crypto";
import tmp from "tmp";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { automation } from "@pulumi/pulumi";

import { HomepageImage, Version } from "./image";

const isIntegration = (process.env.VITEST_RUN_TYPE ?? "").includes("integration:docker");
const timeout = 2 * 60 * 1000; // 2 minutes

const HomepageImageTag = `${process.env.CI_OCI_REGISTRY ?? "oci.local.chezmoi.sh"}/miscellaneous/startpage/homepage:${Version}`;

describe.runIf(isIntegration)("(Miscellaneous/Startpage) Homepage", () => {
    describe("HomepageImage", () => {
        describe("when it is built", { timeout }, () => {
            // -- Prepare Pulumi execution --
            const program = async () => {
                const homepage = new HomepageImage(randomUUID(), {
                    push: true,
                    tags: [HomepageImageTag],
                });
                return { ...homepage };
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

            afterAll(async () => {
                await stack.destroy();
            }, timeout);

            // -- Assertions --
            it("should be successfully built", () => {
                expect(result.summary.result).toBe("succeeded");
                expect(result.outputs?.ref.value).toContain(HomepageImageTag);
            });
        });
    });
});
