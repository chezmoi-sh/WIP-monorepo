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
# trunk-ignore-all(hadolint/DL3006,checkov/CKV_DOCKER_7): ALPN_BASE contains IMAGE, TAG and SHA

# This argument is used to define which image should be used as base layer for
# the runtime image.
ARG ALPN_BASE


# ┌───────────────────────────────────────────────────────────────────────────┐
# │ <source>: download the AdGuardHome source code and cache it               │
# └───────────────────────────────────────────────────────────────────────────┘
FROM ${ALPN_BASE} AS source

ARG ADGUARDHOME_VERSION

# trunk-ignore(hadolint/DL3018): don't care to pin dependencies on build
RUN set -eux; \
    apk add --no-cache git; \
    git clone --depth 1 --branch ${ADGUARDHOME_VERSION} https://github.com/AdguardTeam/AdGuardHome /src;


# ┌───────────────────────────────────────────────────────────────────────────┐
# │ <builder-frontend>: build the AdGuardHome frontend (Node.js)              │
# └───────────────────────────────────────────────────────────────────────────┘
FROM docker.io/library/node:22.3.0-alpine3.19@sha256:9af472b2578996eb3d6affbcb82fdee6f086da2c43121e75038a4a70317f784f AS builder-frontend

WORKDIR /node/src/app
COPY --from=source /src ./

# NOTE: the following environment variable is required to avoid the
#       `ERR_OSSL_EVP_UNSUPPORTED` error when building the frontend.
ENV NODE_OPTIONS="--openssl-legacy-provider"

RUN set -eux; \
    npm --prefix client --ignore-engines --ignore-optional --ignore-platform --ignore-scripts ci; \
    npm --prefix client run build-prod


# ┌───────────────────────────────────────────────────────────────────────────┐
# │ <builder-backend>: build the AdGuardHome backend (Go)                     │
# └───────────────────────────────────────────────────────────────────────────┘
FROM docker.io/library/golang:1.22.4-alpine3.19@sha256:c46c4609d3cc74a149347161fc277e11516f523fd8aa6347c9631527da0b7a56 AS builder-backend

WORKDIR /go/src/app
COPY --from=source /src/ ./

# this step is required to avoid downloading the dependencies every time the
# source code changes, speeding up the build process locally.
RUN go mod download

ARG ADGUARDHOME_VERSION

COPY --from=builder-frontend /node/src/app/build ./build

RUN set -eux; \
    go build \
        -trimpath \
        -ldflags "\
            -s -w \
            -X github.com/AdguardTeam/AdGuardHome/internal/version.version=${ADGUARDHOME_VERSION} \
            -X github.com/AdguardTeam/AdGuardHome/internal/version.channel=release \
            -X github.com/AdguardTeam/AdGuardHome/internal/version.committime=$( git log -1 --pretty=%ct ) \
        " \
        -o AdGuardHome .


# ┌───────────────────────────────────────────────────────────────────────────┐
# │ <runtime>: create the AdGuardHome runtime image using all previous stages │
# └───────────────────────────────────────────────────────────────────────────┘
# NOTE: this base image MUST BE used by any other image of this project to be
#       able to use cache layers and avoid downloading the same dependencies.
FROM ${ALPN_BASE} AS runtime

ARG ADGUARDHOME_VERSION

RUN set -eux; \
    addgroup --system --gid 64138 adguardhome; \
    adduser --system --home /nonexistent --no-create-home --ingroup adguardhome --uid 64138 adguardhome; \
    mkdir --parents /etc/adguardhome /var/lib/adguardhome; \
    chown adguardhome:adguardhome --recursive /etc/adguardhome /var/lib/adguardhome

COPY --chmod=755 entrypoint.sh /entrypoint
COPY --from=builder-backend /go/src/app/AdGuardHome /opt/adguardhome/bin/

USER adguardhome
WORKDIR /var/lib/adguard
ENTRYPOINT ["/entrypoint"]

EXPOSE 3000 3443 3053 3853
VOLUME /var/lib/adguardhome
HEALTHCHECK --interval=15s CMD wget --no-verbose --tries=1 --spider http://localhost:3000 || exit 1

# metadata as defined by the Open Container Initiative (OCI) to keep traceability with
# the source of the container image.
LABEL \
    org.opencontainers.image.authors="chezmoi.sh <xunleii@users.noreply.github.com>" \
    org.opencontainers.image.created="01/01/1970T00:00:00.000" \
    org.opencontainers.image.description="Network-wide ads & trackers blocking DNS server." \
    org.opencontainers.image.documentation="https://github.com/AdguardTeam/AdGuardHome" \
    org.opencontainers.image.licenses="Apache-2.0" \
    org.opencontainers.image.revision="" \
    org.opencontainers.image.source="" \
    org.opencontainers.image.title="homepage" \
    org.opencontainers.image.url="https://github.com/chezmoi-sh/atlas" \
    org.opencontainers.image.version=${ADGUARDHOME_VERSION}
