<!-- markdownlint-disable MD033 -->
<h1 align="center">
  Network · AdGuard Home
  <br/>
  <img src="docs/adguard-home.png" alt="adguard home logo" height="100">
</h1>

<h3 align="center">AdGuard Home - A network-wide ads & trackers blocking DNS server</h3>

<div align="center">

[![Version](https://img.shields.io/badge/Version-v0.107.50-orange.svg)]()
[![Category](https://img.shields.io/badge/Category-Network-purple.svg)](../)
[![License](https://img.shields.io/badge/License-Apache_2.0-blue.svg)](../../../../LICENSE)
<br>
<br>
[![Unofficial distribution](https://img.shields.io/badge/Unofficial_Distribution-coral.svg?logo=gitlfs&logoColor=white)]()
[![Official documentation](https://img.shields.io/badge/Official_documentation-333.svg?logo=github)](https://adguard.com/en/adguard-home/overview.html)

<a href="#about">About</a> ·
<a href="#getting-started">Getting Started</a> ·
<a href="#security-concerns">Security concerns</a> ·
<a href="#license">License</a>

</div>

---

<!-- markdownlint-enable MD033 -->

## About

AdGuard Home is a network-wide software for blocking ads and tracking. After you set it up, it'll cover ALL your home
devices, and you don't need any client-side software for that.

It operates as a DNS server that re-routes tracking domains to a “black hole”, thus preventing your devices from
connecting to those servers.

<!-- markdownlint-disable MD033 -->
<p align="center">
  <img src="docs/68747470733a2f2f63646e2e6164746964792e6f72672f7075626c69632f416467756172642f436f6d6d6f6e2f616467756172645f686f6d652e676966.gif" alt="AdGuard Home live demo" />
</p>
<!-- markdownlint-enable MD033 -->

## Getting Started

This project wraps the AdGuard Home application in a Docker container, making it easy to deploy and run with Pulumi.
In order to keep consistency over all other applications and to follow some best practices, this project builds its
own Docker image.

> [!NOTE]
> This "Pulumi application" was created with a specific vision in mind, so customization is not a strength of this
> project and only certain options (mainly runtime-related) are accessible.

### How to use this application

#### - as Docker container

> [!WARNING]
> The Docker image will embed all configuration files to package everything together ; _following my vision_, an
> OCI image should be immutable and contain everything it needs to run. **This means that all configuration files will
> be embedded in the image, including sensitive information like API keys**. This is not a security best practice, but
> it is a trade-off I made to simplify the deployment process.

```typescript
import { asset } as pulumi from "@pulumi/pulumi";
import { AdGuardHome, Version } from "@catalog.chezmoi.sh/network~adguardhome";
import { AlpineImage, Version as AlpineVersion } from "@catalog.chezmoi.sh/os~alpine-3.19";
import { DirectoryAsset, SecretAsset } from "@chezmoi.sh/core/utils";

const alpine = new AlpineImage("alpine", { push: true, tags: [`my.oci.registry/alpine:${AlpineVersion}`] });
const adguardhome = new AdGuardHome("homepage", {
    imageArgs: { from: alpine, push: true, tags: [`my.oci.registry/adguardhome:${Version}`] },
    containerArgs: {
        ports: [{ internal: 3000, external: 80, protocol: "tcp" }],
        ports: [{ internal: 3053, external: 53, protocol: "udp" }],
        wait: true,
    }
});
```

## Security concerns

One of my visions is to provide a secure environment for all applications that I run at home. This is why all images are
built locally, why all dependencies, when it make sense, are pinned, and why all images are scanned for vulnerabilities
before running them (see [my Pulumi policy packs](../../../../lib/policy-pack/)).
However, even with all these precautions, I'm not a security expert, so I can't guarantee that this project is 100%
secure.

Futhermore, as stated in the [Getting Started](#--as-docker-container) section for the Docker container, all <!-- trunk-ignore(markdown-link-check/404): False positive on the anchor -->
configuration files are embedded in the image, including sensitive information like API keys. Take this into account
when using this project.

## License

This project is licensed under the Apache 2.0 License - see the [LICENSE](../../../../LICENSE) file for details.

> [!NOTE]
> This project is not affiliated with the AdGuard Home project, which can be viewed on
> [their website](https://adguard.com/en/adguard-home/overview.html).
> However, if you are a maintainer of the AdGuard Home project and would like to authorize the distribution of
> AdGuard Home through this project, you are welcome to do so by creating a Pull Request.
