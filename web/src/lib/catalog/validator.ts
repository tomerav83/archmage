// One ajv8 validator, shared by the inspector's live form and the review's findings
// list, so a prop's rules are defined once (in the catalog) and checked in one place.
import { customizeValidator } from '@rjsf/validator-ajv8'

export const validator = customizeValidator()
