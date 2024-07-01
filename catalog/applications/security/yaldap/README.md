<!-- markdownlint-disable MD033 -->
<h1 align="center">
  Security · yaLDPA
  <br/>
  <img src="docs/9f0b3036-377c-4c59-a1aa-b7676401b305.png" alt="yaldap home logo" height="100">
</h1>

<h3 align="center">yaLDAP - Yet Another LDAP</h3>

<div align="center">

[![Version](https://img.shields.io/badge/Version-v0.2.0-orange.svg)]()
[![Category](https://img.shields.io/badge/Category-Security-purple.svg)](../)
[![License](https://img.shields.io/badge/License-Apache_2.0-blue.svg)](../../../../LICENSE)
<br>
<br>
[![Official distribution](https://img.shields.io/badge/Official_Distribution-forestgreen.svg?logo=gitlfs&logoColor=white)]()
[![Official documentation](https://img.shields.io/badge/Official_documentation-333.svg?logo=github)](https://github.com/chezmoi-sh/yaldap)

<a href="#about">About</a> ·
<a href="#getting-started">Getting Started</a> ·
<a href="#security-concerns">Security concerns</a> ·
<a href="#license">License</a>

</div>

---

<!-- markdownlint-enable MD033 -->

## About

yaLDAP is a lightweight and user-friendly LDAP server that utilizes YAML files for directory definitions. Unlike other
simple LDAP servers designed primarily for managing user and group information, yaLDAP stands out by offering full
customization of the LDAP directory.

## Getting Started

This project wraps the yaLDAP application in a Docker container, making it easy to deploy and run with Pulumi.
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
import { Version, yaLDAP } from "@catalog.chezmoi.sh/security~yaldap";
import { AlpineImage, Version as AlpineVersion } from "@catalog.chezmoi.sh/os~alpine-3.19";
import { DirectoryAsset, SecretAsset } from "@chezmoi.sh/core/utils";

const alpine = new AlpineImage("alpine", { push: true, tags: [`my.oci.registry/alpine:${AlpineVersion}`] });
const yaldap = new yaLDAP("yaldap", {
    imageArgs: { from: alpine, push: true, tags: [`my.oci.registry/yaldap:${Version}`] },
    containerArgs: {
        ports: [{ internal: 389, external: 389, protocol: "tcp" }],
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
