import cn from "classnames"
import { Trans as Translate, withTranslation } from "react-i18next"

import { config } from "shared/config"

import packageJson from "../../../../package.json"
import styles from "./styles.module.css"

export const Copyright = withTranslation()((props: { className?: string }) => {
  return (
    <p className={cn(styles.text, props.className)}>
      <Translate
        ns="common"
        i18nKey="copyright"
        values={{ version: packageJson.version, year: new Date().getFullYear() }}
        components={{
          linkRepoUrl: <a target="_blank" href={config.repoUrl} rel="noreferrer /"></a>,
          linkIssue: (
            <a
              target="_blank"
              rel="noreferrer"
              href={config.bugReportUrl}
              className={styles.underlined}
            ></a>
          ),
          linkEmail: <a href="mailto:testy@yadro.com" className={styles.underlined}></a>,
          linkKns: <a target="_blank" href="https://yadro.com" rel="noreferrer"></a>,
        }}
      />
    </p>
  )
})
