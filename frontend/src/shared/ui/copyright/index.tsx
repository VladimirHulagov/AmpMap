import React from "react"

import { config } from "shared/config"

export const Copyright = () => {
  return (
    <p style={{ textAlign: "center", marginBottom: 0, fontSize: 12 }}>
      <a href={config.repoUrl}>TestY TMS version 1.2.7</a>. Released under the AGPL-v3 License.
      <br />
      Found a bug or have a comment?&nbsp;
      <a href={config.bugReportUrl}>Please, let us know</a>
      .
      <br />
      Copyright © {new Date().getFullYear()} KNS Group LLC (YADRO).
    </p>
  )
}
