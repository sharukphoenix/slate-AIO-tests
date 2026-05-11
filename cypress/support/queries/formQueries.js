export const rfiID = 2
export const submittalsID = 8
export const WarrantyIssuesID = 166
export const ProcorerfiID = 150
export const ProcoreObID = 154
export const ProcorePunchID = 164

export const getFormList = `query getFilterListForms($featureId: Int!, $filterData: [json], $limit: Int!, $offset: Int!, $order: String!, $orderBy: String!) {
  listForms_query(
    featureId: $featureId
    filterData: $filterData
    workflowStep: true
    limit: $limit
    offset: $offset
    orderBy: {column: $orderBy, order: $order}
  ) {
    count
    data {
      formsData
      formState
      id
      specificationId
      submittalId
      blockedByCounter
      workflowData
      isImported
    }
  }
}`

export const deleteForm = `mutation deleteForms($formId: Int!) {
  delete_formFeature_mutation(formId: $formId) {
    affected_rows
    __typename
  }
}`

