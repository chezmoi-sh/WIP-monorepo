import { randomUUID } from "crypto";
import tmp from "tmp";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { automation } from "@pulumi/pulumi";

import { AlpineImage, Version as AlpineVersion } from "../../../os/alpine/3.19";
import { Version, yaLDAPImage } from "./image";

const isIntegration = (process.env.VITEST_RUN_TYPE ?? "").includes("integration:docker");
const timeout = 3 * 60 * 1000; // 3 minutes

const AlpineImageTag = `${process.env.CI_OCI_REGISTRY ?? "oci.local.chezmoi.sh"}/os/alpine:${AlpineVersion}`;
const yaLDAPImageTag = `${process.env.CI_OCI_REGISTRY ?? "oci.local.chezmoi.sh"}/security/yaldap:${Version}`;

describe.runIf(isIntegration)("(Security) yaLDAP", () => {
    describe("yaLDAPImage", () => {
        // -- Prepare Pulumi execution --
        const program = async () => {
            const alpine = new AlpineImage(randomUUID(), { push: true, tags: [AlpineImageTag] });
            const yaldap = new yaLDAPImage(randomUUID(), {
                from: alpine,
                push: true,
                tags: [yaLDAPImageTag],
            });
            return { ...yaldap };
        };

        let stack: automation.Stack;
        let result: automation.UpResult;
        beforeAll(async () => {
            const tmpdir = tmp.dirSync();
            stack = await automation.LocalWorkspace.createOrSelectStack(
                {
                    stackName: "yaldap",
                    projectName: "yaldap",
                    program,
                },
                {
                    secretsProvider: "passphrase",
                    projectSettings: {
                        name: "yaldap",
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
            expect(result.outputs?.ref.value).toContain(yaLDAPImageTag);
        });
    });
});
