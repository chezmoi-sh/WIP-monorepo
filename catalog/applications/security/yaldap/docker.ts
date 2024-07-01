/*
 * Copyright (C) 2024 Alexandre Nicolaie (xunleii@users.noreply.github.com)
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *         http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 * ----------------------------------------------------------------------------
 */
import * as docker from "@pulumi/docker";
import * as pulumi from "@pulumi/pulumi";

import {
    CommandContainerArgs,
    HostnameContainerArgs,
    LifecycleContainerArgs,
    RuntimeContainerArgs,
    SecurityContainerArgs,
    StorageContainerArgs,
    types,
} from "@chezmoi.sh/core/docker";
import { InjectAssets } from "@chezmoi.sh/core/utils";
import { InjectableChownableAsset } from "@chezmoi.sh/core/utils/docker";

import { ImageArgs, yaLDAPImage } from "./image";
import { yaLDAPConfiguration } from "./types";
import { Version } from "./version";

export { yaLDAPImage, Version };

/**
 * The arguments for the yaLDAP application.
 * @see {@link yaLDAP}
 */
export interface yaLDAPArgs extends yaLDAPConfiguration {
    /**
     * The set of arguments for constructing the yaLDAP Docker image.
     */
    imageArgs: ImageArgs;

    /**
     * The set of arguments for constructing the yaLDAP Docker container.
     */
    containerArgs?: Omit<
        docker.ContainerArgs,
        | CommandContainerArgs
        | HostnameContainerArgs
        | LifecycleContainerArgs
        | RuntimeContainerArgs
        | SecurityContainerArgs
        | StorageContainerArgs
        | "name"
        | "gpus"
        | "uploads"
    >;
}

/**
 * This component deploys the yaLDAP application through a Docker container.
 */
export class yaLDAP extends pulumi.ComponentResource {
    /**
     * The version of the yaLDAP application.
     */
    public readonly version: string = Version;

    /**
     * The Docker image for the yaLDAP application.
     */
    public readonly image: pulumi.Output<types.Image>;

    /**
     * The Docker container for the yaLDAP application.
     */
    public readonly container: docker.Container;

    constructor(name: string, args: yaLDAPArgs, opts?: pulumi.ComponentResourceOptions) {
        super("chezmoi.sh:security:yaldap:Application", name, {}, opts);

        const config = {
            source: args.configuration,
            destination: "/etc/yaldap/backend.yaml",
            mode: 0o400,
            user: "yaldap",
        } as InjectableChownableAsset;

        const image = new yaLDAPImage(name, args.imageArgs, { parent: this });
        this.image = pulumi.output(
            InjectAssets(image, config).catch((err) => {
                pulumi.log.error(`Failed to build the bundled yaLDAP image: ${err}`);
            }),
        );

        this.container = new docker.Container(
            name,
            {
                // Default container options
                ...{
                    ports: [
                        { internal: 389, external: 389, protocol: "tcp" }, // Web interface (HTTP)
                    ],
                },
                ...args.containerArgs,

                // Enforce some container options
                name: name,
                destroyGraceSeconds: 20,
                image: this.image.ref,
                restart: "unless-stopped",
                user: "yaldap",

                // Enforce security options
                capabilities: { drops: ["ALL"] },
                privileged: false,
                readOnly: true,

                // Add metadata to the container
                labels: pulumi
                    .all([args?.containerArgs?.labels, this.image.ref])
                    .apply(([labels, ref]) =>
                        (labels ?? []).concat([{ label: "org.opencontainers.image.source.ref", value: ref }]),
                    ),
            },
            {
                parent: this,
                // @pulumi/docker-build uses https://github.com/kreuzwerker/terraform-provider-docker
                // to interact with the Docker API. Unfortunately, the provider uses SHA256 hashes
                // as identifiers for images. Because of this and the fact that the image is built
                // using buildx, the SHA256 hash of the image is not always the one that will be
                // used by Docker. To avoid drift, we will ignore any changes on the image property
                // and recreate the container if the label "org.opencontainers.image.source.ref" changes.
                ignoreChanges: ["image"],
                dependsOn: this.image,
                replaceOnChanges: ['labels["org.opencontainers.image.source.ref"]'],
            },
        );
    }
}
