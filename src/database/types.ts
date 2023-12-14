import { ColumnType, Generated, Insertable, Selectable, Updateable } from 'kysely'

export interface Database {
    question: QuestionTable
    answer: AnswerTable
    log: LogTable
}

export interface QuestionTable {
    // Columns that are generated by the database should be marked
    // using the `Generated` type. This way they are automatically
    // made optional in inserts and updates.
    id: Generated<number>

    question: string

}

// You should not use the table schema interfaces directly. Instead, you should
// use the `Selectable`, `Insertable` and `Updateable` wrappers. These wrappers
// make sure that the correct types are used in each operation.
export type Question = Selectable<QuestionTable>
export type NewQuestion = Insertable<QuestionTable>
export type QuestionUpdate = Updateable<QuestionTable>

export interface AnswerTable {
    id: Generated<number>
    text: string
    feedback: string
    score: number
    question_id: number
}

export type Answer = Selectable<AnswerTable>
export type NewAnswer = Insertable<AnswerTable>

export interface LogTable {
    id: Generated<number>
    text: string
    feedback: string
    model: string
    score: number
    question_id: number
}

export type Log = Selectable<LogTable>
export type NewLog = Insertable<LogTable>