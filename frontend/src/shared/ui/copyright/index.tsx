import { config } from "shared/config"

import packageJson from "../../../../package.json"

export const Copyright = () => {
  return (
    <p style={{ textAlign: "center", marginBottom: 0, fontSize: 12 }}>
      <a href={config.repoUrl}>TestY TMS version {packageJson.version}</a>. Released under the
      AGPL-v3 License.
      <br />
      Found a bug or have a comment?&nbsp;
      <a href={config.bugReportUrl}>Please, let us know</a>
      .
      <br />
      Copyright © {new Date().getFullYear()} KNS Group LLC (YADRO).
    </p>
  )
}
