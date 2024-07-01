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
    HostnameContainerArgs,
    LifecycleContainerArgs,
    RuntimeContainerArgs,
    SecurityContainerArgs,
    StorageContainerArgs,
    types,
} from "@chezmoi.sh/core/docker";
import { InjectAssets, InjectableChownableAsset } from "@chezmoi.sh/core/utils/docker";

import { AdGuardHomeImage, ImageArgs } from "./image";
import { AdGuardHomeConfiguration } from "./types";
import { Version } from "./version";

export { AdGuardHomeImage, Version };

/**
 * The set of arguments for constructing a AdGuardHome application.
 * @see {@link AdGuardHome}
 */
export interface AdGuardHomeArgs extends AdGuardHomeConfiguration {
    /**
     * The set of arguments for constructing the AdGuardHome Docker image.
     */
    imageArgs: ImageArgs;

    /**
     * The set of arguments for constructing the AdGuardHome Docker container.
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
    > & {
        volumes?: [ContainerVolume & { containerPath: "/var/lib/adguardhome" }];
    };
}

/**
 * This component deploys the AdGuardHome application through a Docker container in a opinionated way.
 * Only the AdGuardHome configuration and some container options like network or resources are exposed
 * to the user.
 *
 * @see {@link https://adguard.com/adguard-home/overview.html}
 */
export class AdGuardHome extends pulumi.ComponentResource {
    /**
     * The version of the AdGuardHome application.
     */
    public readonly version: string = Version;

    /**
     * The Docker image used by the AdGuardHome application.
     */
    public readonly image: pulumi.Output<types.Image>;

    /**
     * The deployed AdGuardHome Docker container.
     */
    public readonly container: docker.Container;

    constructor(name: string, args: AdGuardHomeArgs, opts?: pulumi.ComponentResourceOptions) {
        super("chezmoi.sh:network:adguardhome:Application", name, {}, opts);

        const config = {
            source: args.configuration,
            destination: "/etc/adguardhome/AdGuardHome.yaml",
            mode: 0o400,
            user: "adguardhome",
        } as InjectableChownableAsset;

        const image = new AdGuardHomeImage(name, args.imageArgs, { parent: this });
        this.image = pulumi.output(
            InjectAssets(image, config).catch((err) => {
                pulumi.log.error(`Failed to build the bundled AdGuardHome image: ${err}`);
            }),
        );
        this.container = new docker.Container(
            name,
            {
                // Default container options
                ...{
                    ports: [
                        { internal: 3053, external: 53, protocol: "udp" }, // DNS
                        { internal: 3053, external: 53, protocol: "tcp" }, // DNS
                        { internal: 3853, external: 853, protocol: "udp" }, // DNS over TLS
                        { internal: 3853, external: 853, protocol: "tcp" }, // DNS over TLS
                        { internal: 3000, external: 80, protocol: "tcp" }, // Web interface (HTTP)
                        { internal: 3443, external: 443, protocol: "tcp" }, // Web interface (HTTPS)
                    ],
                },
                ...args.containerArgs,

                // Enforce some container options
                name: name,
                destroyGraceSeconds: 15,
                image: this.image.ref,
                restart: "unless-stopped",
                tmpfs: {
                    "/var/lib/adguardhome/transient-config": "exec,uid=64138,gid=64138",
                },
                user: "adguardhome",

                // Enforce security options
                capabilities: { drops: ["ALL"] },
                privileged: false,
                readOnly: true,

                // Add persistent storage
                volumes: args.containerArgs?.volumes ?? [
                    {
                        volumeName: new docker.Volume("persistent-volume", { name: `${name}-persistent` }).name,
                        containerPath: "/var/lib/adguardhome",
                    },
                ],

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
