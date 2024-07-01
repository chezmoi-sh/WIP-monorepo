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

export interface AutoHealConfiguration {
    /**
     * Container selector watched by autoheal. If all is specified, all containers will be watched.
     * @default all
     */
    container_label?: string | "all";

    /**
     * Duration to wait before considering the Docker API request as failed (in seconds).
     * @default 30
     */
    docker_timeout?: number;

    /**
     * Default duration to wait before restarting the container (in seconds) if the label 'autoheal.stop.timeout'
     * is not set on the watched container.
     * @default 10
     */
    default_graceful_period?: number;

    /**
     * Interval to check the Docker API for unhealthy containers (in seconds).
     * @default 5
     */
    interval?: number;

    /**
     * Duration to wait just after the container has been started before starting to watch it (in seconds).
     * @default 0
     */
    start_period?: number;
}
