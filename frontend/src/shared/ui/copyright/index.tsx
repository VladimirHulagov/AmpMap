import { config } from "shared/config"

import packageJson from "../../../../package.json"

export const Copyright = () => {
  return (
    <p style={{ textAlign: "center", marginBottom: 0, fontSize: 12 }}>
      <a target="_blank" href={config.repoUrl} rel="noreferrer">
        TestY TMS version {packageJson.version}
      </a>
      . Released under the AGPL-v3 License.
      <br />
      Found a bug or have a comment?&nbsp; Please report an{" "}
      <a target="_blank" rel="noreferrer" href={config.bugReportUrl}>
        issue
      </a>{" "}
      or <a href="mailto:testy@yadro.com">email</a> us.
      <br />
      Copyright © {new Date().getFullYear()}{" "}
      <a target="_blank" href="https://yadro.com" rel="noreferrer">
        KNS Group LLC (YADRO).
      </a>
    </p>
  )
}
