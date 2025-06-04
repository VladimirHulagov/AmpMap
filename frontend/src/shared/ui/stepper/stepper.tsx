import classNames from "classnames"
import { Children, ReactElement, ReactNode, isValidElement } from "react"

import styles from "./stepper.module.css"

interface StepProps {
  children: ReactNode | ReactNode[]
  title: string
  id: string | number
}

export const Step = ({ children }: StepProps) => {
  return children
}

export type StepElement = ReactElement<StepProps>

interface StepperProps {
  activeStepId: string | number
  children: StepElement | StepElement[]
}

export const Stepper = ({ children: items, activeStepId }: StepperProps) => {
  const steps = Children.toArray(items).filter(
    (child): child is StepElement => isValidElement(child) && child.type === Step
  )

  const activeStepIndex = steps.findIndex(({ props: { id } }) => id === activeStepId)

  const activeStepElement = steps.find(({ props: { id } }) => id === activeStepId)

  if (activeStepIndex === -1) {
    return
  }

  return (
    <div>
      <ul className={styles.navigation}>
        {steps.map(({ props: { title, id } }, index) => {
          const expanded =
            index === activeStepIndex ||
            index === activeStepIndex + 1 ||
            (activeStepIndex === steps.length - 1 && index === steps.length - 2)

          return (
            <>
              <li className={classNames(styles.item, { [styles.collapsed]: !expanded })} key={id}>
                <span
                  className={classNames(styles.icon, {
                    [styles.prev]: index < activeStepIndex,
                    [styles.next]: index > activeStepIndex,
                  })}
                >
                  {index + 1}
                </span>
                <span
                  className={classNames(styles.name, {
                    [styles.prev]: index < activeStepIndex,
                    [styles.next]: index > activeStepIndex,
                  })}
                  data-testid={activeStepIndex === index ? "activeStep" : undefined}
                >
                  {title}
                </span>
              </li>
              <li
                className={classNames(styles.line, {
                  [styles.collapsed]:
                    index === steps.length - 1 ||
                    index < activeStepIndex - 1 ||
                    index > activeStepIndex + 1,
                })}
                key={id + "line"}
              />
            </>
          )
        })}
      </ul>
      <div style={{ padding: "0 32px" }}>{activeStepElement?.props?.children}</div>
    </div>
  )
}
