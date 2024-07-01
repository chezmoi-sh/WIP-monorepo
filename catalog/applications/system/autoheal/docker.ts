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
import { ContainerVolume } from "@pulumi/docker/types/input";

import {
    CommandContainerArgs,
    ExposeContainerArgs,
    HostnameContainerArgs,
    LifecycleContainerArgs,
    RuntimeContainerArgs,
    SecurityContainerArgs,
    StorageContainerArgs,
    types,
} from "@chezmoi.sh/core/docker";

import { AutoHealImage, ImageArgs } from "./image";
import { AutoHealConfiguration } from "./types";
import { Version } from "./version";

export { AutoHealImage, Version };

/**
 * The arguments for the autoheal application.
 * @see {@link Application}
 */
export interface AutoHealArgs extends AutoHealConfiguration {
    /**
     * The set of arguments for constructing the autoheal Docker image.
     */
    imageArgs: ImageArgs;

    /**
     * The set of arguments for constructing the autoheal Docker container.
     */
    containerArgs: Omit<
        docker.ContainerArgs,
        | CommandContainerArgs
        | ExposeContainerArgs
        | HostnameContainerArgs
        | LifecycleContainerArgs
        | RuntimeContainerArgs
        | SecurityContainerArgs
        | StorageContainerArgs
        | "name"
        | "gpus"
        | "uploads"
    > & {
        volumes: [
            Pick<ContainerVolume, "containerPath" | "hostPath" | "readOnly"> & {
                containerPath: "/var/run/docker.sock";
                readOnly: true;
            },
        ];
    };
}

/**
 * This component deploys the autoheal application through a Docker container.
 */
export class AutoHeal extends pulumi.ComponentResource {
    /**
     * The version of the autoheal application.
     */
    public readonly version: string = Version;

    /**
     * The Docker image for the autoheal application.
     */
    public readonly image: pulumi.Output<types.Image>;

    /**
     * The Docker container for the autoheal application.
     */
    public readonly container: docker.Container;

    constructor(name: string, args: AutoHealArgs, opts?: pulumi.ComponentResourceOptions) {
        super("chezmoi.sh:system:autoheal:Application", name, {}, opts);

        const image = new AutoHealImage(name, args.imageArgs, { parent: this });
        this.image = pulumi.output(image);
        this.container = new docker.Container(
            name,
            {
                ...args.containerArgs,

                // Enforce some container options
                name: name,
                destroyGraceSeconds: 20,
                envs: [
                    `AUTOHEAL_CONTAINER_LABEL=${args?.container_label ?? "all"}`,
                    `AUTOHEAL_DEFAULT_STOP_TIMEOUT=${args?.default_graceful_period ?? 10}`,
                    `AUTOHEAL_INTERVAL=${args?.interval ?? 5}`,
                    `AUTOHEAL_START_PERIOD=${args?.start_period ?? 0}`,
                    `CURL_TIMEOUT=${args?.docker_timeout ?? 30}`,
                ],
                image: this.image.ref,
                restart: "unless-stopped",
                user: "root",

                // Enforce security options
                capabilities: { drops: ["ALL"] },
                privileged: false,
                readOnly: true,

                // Add Docker socket
                volumes: args.containerArgs.volumes,

                // Add metadata to the container
                labels: pulumi
                    .all([args?.containerArgs?.labels, this.image.ref])
                    .apply(([labels, ref]) =>
                        (labels ?? []).concat([{ label: "org.opencontainers.image.source.ref", value: ref }]),
                    ),

                networkMode: "none",
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
