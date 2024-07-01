# Copyright (C) 2024 Alexandre Nicolaie (xunleii@users.noreply.github.com)
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#         http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.
# ----------------------------------------------------------------------------
#
# trunk-ignore-all(checkov/CKV_DOCKER_2,trivy/DS026): Autoheal doesn't have a healthcheck
# trunk-ignore-all(checkov/CKV_DOCKER_7,hadolint/DL3006): ALPN_BASE contains IMAGE, TAG and SHA
# trunk-ignore-all(checkov/CKV_DOCKER_8,trivy/DS002,hadolint/DL3002): This image needs to be run as root to communicate with the Docker socket

# This argument is used to define which image should be used as base layer for
# the runtime image.
ARG ALPN_BASE


# ┌───────────────────────────────────────────────────────────────────────────┐
# │ <runtime>: create the Authelia runtime image using all previous stages    │
# └───────────────────────────────────────────────────────────────────────────┘
# NOTE: this base image MUST BE used by any other image of this project to be
#       able to use cache layers and avoid downloading the same dependencies.
# TODO: rewrite this application in Go to reduce the surface attack.
FROM ${ALPN_BASE} AS runtime

ARG AUTOHEAL_VERSION

# renovate: datasource=repology depName=alpine_3_19/bash versioning=loose
ARG BASH_VERSION="5.2.21-r0"
# renovate: datasource=repology depName=alpine_3_19/curl versioning=loose
ARG CURL_VERSION="8.5.0-r0"
# renovate: datasource=repology depName=alpine_3_19/jq versioning=loose
ARG JQ_VERSION="1.7.1-r0"

RUN set -eux; \
    apk add --no-cache \
        bash=${BASH_VERSION} \
        curl=${CURL_VERSION} \
        jq=${JQ_VERSION};

COPY --chmod=555 entrypoint.sh /entrypoint

ENV AUTOHEAL_CONTAINER_LABEL=autoheal \
    AUTOHEAL_DEFAULT_STOP_TIMEOUT=10 \
    AUTOHEAL_INTERVAL=5 \
    AUTOHEAL_START_PERIOD=0 \
    CURL_TIMEOUT=30 \
    DOCKER_SOCK=/var/run/docker.sock

USER root
ENTRYPOINT ["/entrypoint"]

# metadata as defined by the Open Container Initiative (OCI) to keep traceability with
# the source code.
LABEL \
    org.opencontainers.image.authors="chezmoi.sh <xunleii@users.noreply.github.com>" \
    org.opencontainers.image.created="01/01/1970T00:00:00.000" \
    org.opencontainers.image.description="Monitor and restart unhealthy docker containers." \
    org.opencontainers.image.documentation="https://github.com/willfarrell/docker-autoheal" \
    org.opencontainers.image.licenses="Apache-2.0" \
    org.opencontainers.image.revision="" \
    org.opencontainers.image.source="" \
    org.opencontainers.image.title="autoheal" \
    org.opencontainers.image.url="https://github.com/chezmoi-sh/nex.rpi" \
    org.opencontainers.image.version=${AUTOHEAL_VERSION}
