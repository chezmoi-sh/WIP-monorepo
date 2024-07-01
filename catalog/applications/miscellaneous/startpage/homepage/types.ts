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
import { FileAsset, RemoteAsset, StringAsset } from "@pulumi/pulumi/asset";

import { SecretAsset } from "@chezmoi.sh/core/utils";

type Asset = FileAsset | RemoteAsset | StringAsset | SecretAsset<FileAsset | RemoteAsset | StringAsset>;

export interface HomepageConfiguration {
    /**
     * Optional public Homepage assets (image, sound, etc.) to include in the Homepage image.
     * @key The relative path to the asset.
     * @value The asset content.
     */
    public?: Record<string, Asset>;

    /**
     * The Homepage configuration to include in the Docker image.
     */
    configuration?: {
        /**
         * Optional Homepage bookmarks.
         * @see {@link https://gethomepage.dev/latest/configs/bookmarks/}
         */
        bookmarks?: Asset;

        /**
         * An optional custom CSS file to provide your own styles to Homepage.
         * @see {@link https://gethomepage.dev/latest/configs/custom-css-js/}
         */
        customCSS?: Asset;

        /**
         * An optional custom JavaScript file to provide your own scripts to Homepage.
         * @see {@link https://gethomepage.dev/latest/configs/custom-css-js/}
         */
        customJS?: Asset;

        /**
         * Optional Homepage Docker instance configuration.
         * @see {@link https://gethomepage.dev/latest/configs/docker/}
         */
        docker?: Asset;

        /**
         * Optional Homepage Kubernetes configuration.
         * @see {@link https://gethomepage.dev/latest/configs/kubernetes/}
         */
        kubernetes?: Asset;

        /**
         * Optional Homepage services configuration.
         * @see {@link https://gethomepage.dev/latest/configs/services/}
         */
        services?: Asset;

        /**
         * Homepage settings.
         * @see {@link https://gethomepage.dev/latest/configs/settings/}
         */
        settings?: Asset;

        /**
         * Homepage widgets configuration.
         * @see {@link https://gethomepage.dev/latest/widgets/info/}
         */
        widgets?: Asset;
    };
}
