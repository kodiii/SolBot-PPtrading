# Tracker Module Class Diagram

```mermaid
classDiagram

%% Type aliases for namespaces
%% T for Types
%% PV for PriceValidation

class HoldingRecord {
    +Time: number
    +Token: string  
    +TokenName: string
    +Balance: Decimal
    +SolPaid: Decimal
    +SolFeePaid: Decimal
    +SolPaidUSDC: Decimal
    +SolFeePaidUSDC: Decimal
    +PerTokenPaidUSDC: Decimal
    +Slot: number
    +Program: string
}

class NewTokenRecord {
    +time: number
    +name: string
    +mint: string
    +creator: string
}

class DatabaseService {
    +createTableHoldings(database: any): Promise~boolean~
    +createTableNewTokens(database: any): Promise~boolean~
    +getDb(): Promise~Database~
    +insertHolding(holding: HoldingRecord): Promise~void~
    +removeHolding(tokenMint: string): Promise~void~
    +insertNewToken(newToken: NewTokenRecord): Promise~void~
    +selectTokenByNameAndCreator(name: string, creator: string): Promise~NewTokenRecord[]~
    +selectTokenByMint(mint: string): Promise~NewTokenRecord[]~
    +selectAllTokens(): Promise~NewTokenRecord[]~
    +getOpenPositionsCount(testDb?: any): Promise~number~
}

class PriceValidator {
    -windowSize: number
    -maxDeviation: number
    -minDataPoints: number
    -priceHistory: Map~string, PricePoint[]~
    +constructor(config: PriceValidatorConfig)
    +addPricePoint(token: string, point: PricePoint)
    +validatePrice(token: string, price: number, source: string): ValidationResult
}

class TokenTracker {
    -priceValidator: PriceValidator
    -actionsLogs: string[]
    -main(): Promise~void~
    +initialize()
}

class PricePoint {
    +price: Decimal
    +timestamp: number
    +source: string
}

class ValidationResult {
    +isValid: boolean
    +reason?: string
}

%% External interfaces
class JupiterPriceData {
    +data: Record~string, PriceInfo~
}

class LastPriceDexResponse {
    +pairs: DexPair[]
}

%% Relationships
DatabaseService ..> HoldingRecord
DatabaseService ..> NewTokenRecord
TokenTracker --> PriceValidator
TokenTracker ..> JupiterPriceData
TokenTracker ..> LastPriceDexResponse 
TokenTracker ..> DatabaseService
PriceValidator --> PricePoint
PriceValidator --> ValidationResult

%% Notes and descriptions
note for TokenTracker "Main tracking system for portfolio management"
note for DatabaseService "SQLite operations for holdings and tokens"
note for PriceValidator "Validates prices from multiple sources"
```

The diagram shows the key components of the tracker module:

1. **DatabaseService**: Handles all SQLite operations for both holdings and new token listings
2. **TokenTracker**: Main system that monitors portfolios and executes trading strategies
3. **PriceValidator**: Validates prices from multiple sources using configurable parameters
4. **Data Models**: 
   - HoldingRecord: Token position details
   - NewTokenRecord: New token listing information
   - PricePoint: Price data point with source and timestamp
   - ValidationResult: Price validation result

Key relationships:
- TokenTracker uses DatabaseService for persistence
- TokenTracker uses PriceValidator for price validation
- TokenTracker processes external price data (Jupiter, DexScreener)