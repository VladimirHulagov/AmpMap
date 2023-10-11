import { PlusOutlined } from "@ant-design/icons"
import { Button } from "antd"
import { ReactSortable } from "react-sortablejs"

import {
  TestCaseStepsBlockProps,
  useTestCaseStepsBlock,
} from "entities/test-case/model/use-test-case-steps-block"

import { Steps } from "shared/ui"

import { TestCaseStepsModal } from "../test-case-steps-modal"
import styles from "./styles.module.css"

export const TestCaseStepsBlock = ({ steps, setSteps, setValue }: TestCaseStepsBlockProps) => {
  const {
    handleStep,
    handleSortSteps,
    handleDeleteStep,
    handleClickCloseModal,
    handleClickEditStep,
    isEdit,
    modalStep,
    handleSubmit,
  } = useTestCaseStepsBlock({ steps, setSteps, setValue })

  return (
    <div className={styles.wrapper}>
      <Button
        id="add-step"
        key="add-step"
        size="middle"
        icon={<PlusOutlined />}
        onClick={handleStep}
      >
        Add step
      </Button>
      <ul className={styles.ul}>
        <ReactSortable
          list={steps.map((i) => ({ ...i, chosen: false }))}
          setList={handleSortSteps}
          animation={150}
          ghostClass={styles.ghostClass}
          handle=".handle"
        >
          {steps.map((item, index) => (
            <Steps.Step
              key={item.sort_order}
              step={item}
              index={index}
              actions={{ onClickDelete: handleDeleteStep, onClickEdit: handleClickEditStep }}
            />
          ))}
        </ReactSortable>
      </ul>
      <TestCaseStepsModal
        isEdit={isEdit}
        step={modalStep}
        onCloseModal={handleClickCloseModal}
        onSubmit={handleSubmit}
      />
    </div>
  )
}
