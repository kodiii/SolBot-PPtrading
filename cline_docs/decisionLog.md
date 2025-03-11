## Transaction Processing Type Refactoring (2025-03-11)

### Context
During paper trading service refactoring, we discovered issues with transaction-related type definitions and their usage across the system.

### Decision
1. Created dedicated transaction type definitions:
   - Moved transaction-specific types to `transactions/types.ts`
   - Simplified MintsDataReponse to match actual usage
   - Added proper type definitions for SwapEventDetailsResponse

2. Updated type imports:
   - Changed imports from ../types to ../transactions/types
   - Added explicit type annotations
   - Improved type safety in transaction processing

### Benefits
- Better type organization
- Clearer type definitions
- Improved type safety
- Explicit import paths
- Better maintainability

### Consequences
- Need to update other parts of the system that use these types
- May need to add more types as the system grows
- Need to maintain backwards compatibility

### Follow-up Tasks
1. Review and update other files using transaction types
2. Add comprehensive type documentation
3. Add type validation where needed
4. Consider adding type conversion utilities