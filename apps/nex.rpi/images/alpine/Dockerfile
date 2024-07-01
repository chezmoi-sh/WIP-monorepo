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
# trunk-ignore-all(checkov/CKV_DOCKER_3): This is a base image and should not be run directly, so no USER required.
# trunk-ignore-all(checkov/CKV_DOCKER_2): This is a base image and should not be run directly, so no HEALTHCHECK required.
# trunk-ignore-all(hadolint/DL3029,hadolint/DL3025)

# ┌───────────────────────────────────────────────────────────────────────────┐
# │ <runtime>: create the Alpine base image with all dependencies shared by   │
# |            all other images of this project.                              │
# └───────────────────────────────────────────────────────────────────────────┘
FROM --platform=arm64 docker.io/library/alpine:3.20.1@sha256:b89d9c93e9ed3597455c90a0b88a8bbb5cb7188438f70953fede212a0c4394e0

# renovate: datasource=repology depName=alpine_3_19/bash versioning=loose
ARG BASH_VERSION=5.2.21-r0
# renovate: datasource=repology depName=alpine_3_19/ca-certificates versioning=loose
ARG CA_CERTIFICATES_VERSION=20240226-r0
# renovate: datasource=repology depName=alpine_3_19/curl versioning=loose
ARG CURL_VERSION=8.5.0-r0
# renovate: datasource=repology depName=alpine_3_19/openldap-clients versioning=loose
ARG OPENLDAP_CLIENTS_VERSION=2.6.6-r1
# renovate: datasource=repology depName=alpine_3_19/tzdata versioning=loose
ARG TZDATA_VERSION=2024a-r0

# This argument is used to define the build type (live or ci). It is overridden
# by the build system to point to the correct directory (CI or build).
ARG BUILD_TYPE "live"
RUN set -eux; \
    apk add --no-cache \
        ca-certificates=${CA_CERTIFICATES_VERSION} \
        tzdata=${TZDATA_VERSION}; \
    [ ! "${BUILD_TYPE}" = "ci" ] || \
    apk add --no-cache \
        bash=${BASH_VERSION} \
        curl=${CURL_VERSION} \
        openldap-clients=${OPENLDAP_CLIENTS_VERSION}

# metadata as defined by the Open Container Initiative (OCI) to keep traceability with
# the source of the container image.
LABEL \
    org.opencontainers.image.authors="Beluga-Cloud <xunleii@users.noreply.github.com>" \
    org.opencontainers.image.created="1970-01-01 00:00:00.000000000Z" \
    org.opencontainers.image.description="Alpine base image used by all projects." \
    org.opencontainers.image.documentation="https://docs.alpinelinux.org" \
    org.opencontainers.image.licenses="MIT" \
    org.opencontainers.image.revision="" \
    org.opencontainers.image.source="" \
    org.opencontainers.image.title="alpine" \
    org.opencontainers.image.url="https://github.com/chezmoi-sh/nex.rpi"
