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
import { InjectAssets, InjectableChownableAsset } from "@chezmoi.sh/core/utils/docker";

import { HomepageImage, ImageArgs } from "./image";
import { HomepageConfiguration } from "./types";
import { Version } from "./version";

export { HomepageImage, Version };

/**
 * The set of arguments for constructing a Homepage application.
 * @see {@link Homepage}
 */
export interface HomepageArgs extends HomepageConfiguration {
    /**
     * The set of arguments for constructing the Homepage Docker image.
     */
    imageArgs: ImageArgs;

    /**
     * The set of arguments for constructing the Homepage Docker container.
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
 * This component deploys the Homepage application through a Docker container in a opinionated way.
 * Only the Homepage configuration and some container options like network or resources are exposed
 * to the user.
 *
 * @see {@link https://gethomepage.dev}
 */
export class Homepage extends pulumi.ComponentResource {
    /**
     * The version of the Homepage application.
     */
    public readonly version: string = Version;

    /**
     * The Docker image used by the Homepage application.
     */
    public readonly image: pulumi.Output<types.Image>;

    /**
     * The deployed Homepage Docker container.
     */
    public readonly container: docker.Container;

    constructor(name: string, args: HomepageArgs, opts?: pulumi.ComponentResourceOptions) {
        super("chezmoi.sh:miscellaneous/homepage:homepage:Application", name, {}, opts);

        const assets: InjectableChownableAsset[] = Object.entries(args.public ?? {})
            .map(([path, asset]) => ({
                source: asset,
                destination: `/app/public/${path}`,
            }))
            .concat(
                args.configuration?.bookmarks
                    ? [{ source: args.configuration.bookmarks, destination: "/app/config/bookmarks.yaml" }]
                    : [],
                args.configuration?.customCSS
                    ? [{ source: args.configuration.customCSS, destination: "/app/config/custom.css" }]
                    : [],
                args.configuration?.customJS
                    ? [{ source: args.configuration.customJS, destination: "/app/config/custom.js" }]
                    : [],
                args.configuration?.docker
                    ? [{ source: args.configuration.docker, destination: "/app/config/docker.yaml" }]
                    : [],
                args.configuration?.kubernetes
                    ? [{ source: args.configuration.kubernetes, destination: "/app/config/kubernetes.yaml" }]
                    : [],
                args.configuration?.services
                    ? [{ source: args.configuration.services, destination: "/app/config/services.yaml" }]
                    : [],
                args.configuration?.settings
                    ? [{ source: args.configuration.settings, destination: "/app/config/settings.yaml" }]
                    : [],
                args.configuration?.widgets
                    ? [{ source: args.configuration.widgets, destination: "/app/config/widgets.yaml" }]
                    : [],
            )
            .map((c) => ({ ...c, mode: 0o400, user: "homepage" }));

        const image = new HomepageImage(name, args.imageArgs, { parent: this });
        this.image = pulumi.output(
            InjectAssets(image, ...assets).catch((err) => {
                pulumi.log.error(`Failed to build the bundled Homepage image: ${err}`);
            }),
        );

        this.container = new docker.Container(
            name,
            {
                // Default container options
                ...{
                    ports: [
                        { internal: 3000, external: 80, protocol: "tcp" }, // Web interface (HTTP)
                    ],
                    envs: ["LOG_LEVEL=debug", "LOG_TARGETS=stdout"],
                },
                ...args.containerArgs,

                // Enforce some container options
                name: name,
                destroyGraceSeconds: 20,
                image: this.image.ref,
                restart: "unless-stopped",
                user: "homepage",

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
