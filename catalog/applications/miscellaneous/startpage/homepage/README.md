<!-- markdownlint-disable MD033 -->
<h1 align="center">
  Miscellaneous / Startpage · Homepage
  <br/>
  <br>
  <img src="docs/homepage.png" alt="homepage application logo" height="75">
</h1>

<h3 align="center">Homepage - A highly customizable homepage</h3>

<div align="center">

[![Version](https://img.shields.io/badge/Version-v0.8.13-orange.svg)]()
[![Category](https://img.shields.io/badge/Category-Miscellaneous-purple.svg)](../../)
[![License](https://img.shields.io/badge/License-Apache_2.0-blue.svg)](../../../../../LICENSE)
<br>
<br>
[![Unofficial distribution](https://img.shields.io/badge/Unofficial_Distribution-coral.svg?logo=gitlfs&logoColor=white)]()
[![Official documentation](https://img.shields.io/badge/Official_documentation-333.svg?logo=github)](https://gethomepage.dev/latest/)

<a href="#about">About</a> ·
<a href="#getting-started">Getting Started</a> ·
<a href="#security-concerns">Security concerns</a> ·
<a href="#license">License</a>

</div>

---

<!-- markdownlint-enable MD033 -->

## About

Homepage is a modern, fully static, fast, secure fully proxied, highly customizable application dashboard with
integrations for over 100 services and translations into multiple languages. Easily configured via YAML files or
through docker and kubernetes label discovery.

<!-- markdownlint-disable MD033 -->
<p align="center">
  <img src="docs/homepage_demo.png" alt="Homepage screenshot" />
</p>
<!-- markdownlint-enable MD033 -->

### Features

With features like quick search, bookmarks, weather support, a wide range of integrations and widgets, an elegant and
modern design, and a focus on performance, Homepage is your ideal start to the day and a handy companion throughout it.

-   Fast - The site is statically generated at build time for instant load times.
-   Secure - All API requests to backend services are proxied, keeping your API keys hidden. Constantly reviewed for
    security by the community.
-   For Everyone - Images built for AMD64, ARM64, ARMv7, and ARMv6.
-   Full i18n - Support for over 40 languages.
-   Service & Web Bookmarks - Add custom links to the homepage.
-   Docker Integration - Container status and stats. Automatic service discovery via labels.
-   Service Integration - Over 100 service integrations, including popular starr and self-hosted apps.
-   Information & Utility Widgets - Weather, time, date, search, and more.
-   And much more...

## Getting Started

This project wraps the Homepage application in a Docker container, making it easy to deploy and run with Pulumi.
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
import { Homepage, Version } from "@catalog.chezmoi.sh/miscellaneous.startpage~homepage";
import { DirectoryAsset, SecretAsset } from "@chezmoi.sh/core/utils";

const homepage = new Homepage("homepage", {
    public: new DirectoryAsset(`public`).assets.reduce(
        (acc, asset) => ({ ...acc, [asset.destination]: asset.source }),
        {},
    ),
    configuration: {
        bookmarks: new asset.FileAsset(`bookmarks.yaml`),
        customCSS: new asset.FileAsset(`custom.css`),
        customJS: new asset.FileAsset(`custom.js`),
        services: new SecretAsset(new asset.FileAsset(`services.yaml`)),
        settings: new asset.FileAsset(`settings.yaml`),
        widgets: new asset.FileAsset(`widgets.yaml`),
    },

    imageArgs: { push: true, tags: [`my.oci.registry:${Version}`] },
    containerArgs: {
        ports: [{ internal: 3000, external: 80, protocol: "tcp" }],
        wait: true,
    }
});
```

## Security concerns

One of my visions is to provide a secure environment for all applications that I run at home. This is why all images are
built locally, why all dependencies, when it make sense, are pinned, and why all images are scanned for vulnerabilities
before running them (see [my Pulumi policy packs](../../../../../lib/policy-pack)).
However, even with all these precautions, I'm not a security expert, so I can't guarantee that this project is 100%
secure.

Futhermore, as stated in the [Getting Started](#--as-docker-container) section for the Docker container, all <!-- trunk-ignore(markdown-link-check/404): False positive on the anchor -->
configuration files are embedded in the image, including sensitive information like API keys. Take this into account
when using this project.

## License

This project is licensed under the Apache 2.0 License - see the [LICENSE](../../../../../LICENSE) file for details.

> [!NOTE]
> This project is not affiliated with the Homepage project, which can be viewed on
> [their website](https://gethomepage.dev/latest/).
> However, if you are a maintainer of the Homepage project and would like to authorize the distribution of Homepage
> through this project, you are welcome to do so by creating a Pull Request.
