# Copyright 2024
#
# Everyone is permitted to copy, distribute, modify, merge, sell, publish,
# sublicense or whatever the fuck they want with this software but at their
# OWN RISK.
# The author has absolutely no fucking clue what the code in this project
# does. It might just fucking work or not, there is no third option.
#
# IN NO EVENT SHALL THE AUTHORS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
# LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING
# FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER
# DEALINGS IN THE SOFTWARE.
# ---
# trunk-ignore-all(hadolint/DL3025)
# trunk-ignore-all(terrascan/AC_DOCKER_0001,hadolint/DL3029)
# trunk-ignore-all(terrascan/AC_DOCKER_0041,terrascan/AC_DOCKER_0047,terrascan/AC_DOCKER_00024)

# This argument is used to define the build type (live or ci). It is overridden
# by the build system to point to the correct directory (CI or build).
ARG BUILD_TYPE "live"

# ┌───────────────────────────────────────────────────────────────────────────┐
# │ <source>: download the AdGuardHome source code and cache it               │
# └───────────────────────────────────────────────────────────────────────────┘
FROM docker.io/library/alpine:3.20.1@sha256:b89d9c93e9ed3597455c90a0b88a8bbb5cb7188438f70953fede212a0c4394e0 as source

# renovate: datasource=github-tags depName=AdguardTeam/AdGuardHome versioning=semver
ARG ADGUARDHOME_VERSION="v0.107.50"

# trunk-ignore(hadolint/DL3018): don't care to pin dependencies on build
RUN set -eux; \
    apk add --no-cache git; \
    git clone --depth 1 --branch ${ADGUARDHOME_VERSION} https://github.com/AdguardTeam/AdGuardHome /src;



# ┌───────────────────────────────────────────────────────────────────────────┐
# │ <builder-frontend>: build the AdGuardHome frontend (Node.js)              │
# └───────────────────────────────────────────────────────────────────────────┘
FROM docker.io/library/node:22.2.0-alpine3.19@sha256:9e8f45fc08c709b1fd87baeeed487977f57585f85f3838c01747602cd85a64bb as builder-frontend

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
FROM docker.io/library/golang:1.22.3-alpine3.19@sha256:f1fe698725f6ed14eb944dc587591f134632ed47fc0732ec27c7642adbe90618 as builder-backend

WORKDIR /go/src/app
COPY --from=source /src/ ./

# this step is required to avoid downloading the dependencies every time the
# source code changes, speeding up the build process locally.
RUN go mod download

# renovate: datasource=github-tags depName=AdguardTeam/AdGuardHome versioning=semver
ARG ADGUARDHOME_VERSION="v0.107.50"

ENV GOOS=linux
ENV GOARCH=arm64

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
FROM --platform=arm64 localhost/nex.rpi/alpine:${BUILD_TYPE} as runtime

# renovate: datasource=github-tags depName=AdguardTeam/AdGuardHome versioning=semver
ARG ADGUARDHOME_VERSION="v0.107.50"

RUN set -eux; \
    addgroup --system --gid 64138 adguardhome; \
    adduser --system --home /nonexistent --no-create-home --ingroup adguardhome --uid 64138 adguardhome; \
    mkdir --parents /etc/adguardhome /var/lib/adguardhome; \
    chown adguardhome:adguardhome --recursive /etc/adguardhome /var/lib/adguardhome

COPY entrypoint.sh /entrypoint.sh
COPY --from=builder-backend /go/src/app/AdGuardHome /opt/adguardhome/bin/

USER adguardhome
WORKDIR /var/lib/adguard
ENTRYPOINT /entrypoint.sh

EXPOSE 3000 3443 3053 3853
VOLUME /etc/adguardhome /var/lib/adguardhome
HEALTHCHECK --interval=15s CMD wget --no-verbose --tries=1 --spider http://localhost:3000 || exit 1

# metadata as defined by the Open Container Initiative (OCI) to keep traceability with
# the source of the container image.
LABEL \
    org.opencontainers.image.authors="Beluga-Cloud <xunleii@users.noreply.github.com>" \
    org.opencontainers.image.created="01/01/1970T00:00:00.000" \
    org.opencontainers.image.description="Network-wide ads & trackers blocking DNS server." \
    org.opencontainers.image.documentation="https://github.com/AdguardTeam/AdGuardHome" \
    org.opencontainers.image.licenses="GPL-3.0 license" \
    org.opencontainers.image.revision="" \
    org.opencontainers.image.source="" \
    org.opencontainers.image.title="homepage" \
    org.opencontainers.image.url="https://github.com/chezmoi-sh/nex.rpi" \
    org.opencontainers.image.version=${ADGUARDHOME_VERSION}


# ┌───────────────────────────────────────────────────────────────────────────┐
# └───────────────────────────────────────────────────────────────────────────┘
FROM runtime

# This argument is used to define the build type (live or ci). It is overridden
# by the build system to point to the correct directory (CI or build).
ARG BUILD_TYPE "live"

COPY --chown=adguardhome:adguardhome ${BUILD_TYPE}/config/AdGuardHome.yaml /opt/adguardhome/config/AdGuardHome.yaml
