# Paper Trading System Architecture

The paper trading system is structured using several key modules that work together to provide paper trading functionality. Below is a class diagram showing the relationships between these components.

```mermaid
classDiagram
    %% Core Service
    class SimulationService {
        -instance: SimulationService
        -priceCheckInterval: NodeJS.Timeout
        -strategies: IStrategy[]
        +getInstance() SimulationService
        +executeBuy(tokenMint, tokenName, price)
        -executeSell(token, reason)
        -checkStrategies(marketData)
        -startPriceTracking()
        -updateSolPrice()
    }

    %% Database Layer
    class ConnectionManager {
        -instance: ConnectionManager
        -dbPath: string
        +getInstance(dbPath) ConnectionManager
        +getConnection()
        +closeConnection()
    }

    %% Strategy Pattern
    class IStrategy {
        <<interface>>
        +onMarketData(data: MarketData)
        +getName()
        +getDescription()
        +isEnabled()
    }

    class BaseStrategy {
        <<abstract>>
        #config: BaseStrategyConfig
        #lastCheck: Map<string, number>
        +onMarketData(data)*
        +getName()*
        +getDescription()*
        +isEnabled()
        #createSellSignal()
        #createHoldSignal()
    }

    class LiquidityDropStrategy {
        -config: LiquidityDropStrategyConfig
        +onMarketData()
        +getName()
        +getDescription()
    }

    %% CLI Components
    class PaperTradingDashboard {
        +startDashboard()
        -renderDashboardSections()
        -displayDashboard()
    }

    class DashboardDisplay {
        <<interface>>
        +displayVirtualBalance()
        +displayActivePositions()
        +displayRecentTrades()
        +displayTradingStats()
    }

    %% Data Types
    class MarketData {
        <<interface>>
        +token_mint: string
        +token_name: string
        +current_price: Decimal
        +volume_m5: number
        +marketCap: number
        +liquidity_usd: number
        +timestamp: number
    }

    class TokenTracking {
        +token_mint: string
        +token_name: string
        +amount: Decimal
        +buy_price: Decimal
        +current_price: Decimal
        +time_buy: number
    }

    %% Relationships
    SimulationService --> ConnectionManager : uses
    SimulationService --> "0..*" IStrategy : manages
    BaseStrategy ..|> IStrategy : implements
    LiquidityDropStrategy --|> BaseStrategy : extends
    PaperTradingDashboard --> SimulationService : uses
    PaperTradingDashboard --> DashboardDisplay : uses
    SimulationService ..> MarketData : creates
    SimulationService ..> TokenTracking : manages
    IStrategy ..> MarketData : uses
    BaseStrategy ..> TokenTracking : uses
```

## Component Descriptions

### Core Service Layer
- **SimulationService**: Singleton service managing paper trading simulation, market data updates, and trading strategy execution
- **ConnectionManager**: Singleton managing database connections and operations

### Strategy Pattern Implementation
- **IStrategy**: Interface defining contract for trading strategies
- **BaseStrategy**: Abstract base class implementing common strategy functionality
- **LiquidityDropStrategy**: Concrete strategy implementation for liquidity-based trading

### CLI Interface
- **PaperTradingDashboard**: Main dashboard interface displaying trading information
- **DashboardDisplay**: Interface for different dashboard display components

### Data Models
- **MarketData**: Interface representing current market conditions
- **TokenTracking**: Interface representing tracked token positions

## Key Design Patterns
1. **Singleton Pattern**: Used in SimulationService and ConnectionManager to ensure single instance
2. **Strategy Pattern**: Used for implementing different trading strategies
3. **Observer Pattern**: Used in price tracking and market data updates
4. **Facade Pattern**: CLI dashboard provides simplified interface to complex trading system

## Data Flow
1. SimulationService periodically fetches market data for tracked tokens
2. Market data is passed through configured trading strategies
3. Strategies analyze data and may trigger trading signals
4. Trading operations are simulated and recorded in the database
5. Dashboard components observe and display updated trading information