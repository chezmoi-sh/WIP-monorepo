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
import path from "path";

import * as pulumi from "@pulumi/pulumi";

import { LocalImage, types } from "@chezmoi.sh/core/docker";

import { Version } from "./version";

export { Version };

/**
 * The set of arguments for constructing the autoheal Docker image.
 */
export interface ImageArgs extends types.ImageArgs {
    /**
     * The base image to use in order to build the autoheal image.
     * WARNING: The base image must be compatible a Alpine Linux image.
     */
    from: pulumi.Input<types.Image>;
}

/**
 * An autoheal Docker image baked by buildx -- Docker's interface to the improved
 * BuildKit backend.
 */
export class AutoHealImage extends LocalImage {
    constructor(name: string, args: ImageArgs, opts?: pulumi.ComponentResourceOptions) {
        // Get the base image to use for building the autoheal image. If no base image is provided,
        // we will use the latest Alpine Linux image.
        const base = pulumi.output(args.from);

        super(
            name,
            {
                // Copy base image configuration options
                ...{
                    addHosts: base.addHosts.apply((v) => v ?? []),
                    builder: base.builder.apply((v) => v ?? {}),
                    buildOnPreview: base.buildOnPreview.apply((v) => v ?? true),
                    cacheFrom: base.cacheFrom.apply((v) => v ?? []),
                    cacheTo: base.cacheTo.apply((v) => v ?? []),
                    exec: base.exec.apply((v) => v ?? false),
                    exports: base.exports.apply((v) => v ?? []),
                    load: base.load.apply((v) => v ?? false),
                    network: base.network.apply((v) => v ?? "default"),
                    noCache: base.noCache.apply((v) => v ?? false),
                    platforms: base.platforms.apply((v) => v ?? []),
                    pull: base.pull.apply((v) => v ?? false),
                    push: base.push,
                    registries: base.registries.apply((v) => v ?? []),
                    ssh: base.ssh.apply((v) => v ?? []),
                    tags: base.tags.apply((v) => v ?? []),
                },
                ...args,

                // Build the image
                context: { location: __dirname },
                dockerfile: { location: path.join(__dirname, "Dockerfile") },
                buildArgs: {
                    ALPN_BASE: base.ref,
                    AUTOHEAL_VERSION: Version,
                },
            },
            opts,
        );
    }
}
