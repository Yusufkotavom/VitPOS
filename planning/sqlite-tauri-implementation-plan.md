# SQLite with Tauri Implementation Plan

## Current State

- Web version uses Dexie (IndexedDB) for local storage
- Tauri desktop shell exists but doesn't have functional SQLite integration
- Android support planned but not yet implemented
- Existing local-db structure needs to be adapted for cross-platform support

## Goal

Create a unified local storage adapter system that:
1. Uses Dexie for web/mobile platforms
2. Uses SQLite for Tauri desktop
3. Provides a seamless interface for all platforms
4. Maintains offline-first capabilities with outbox pattern
5. Supports sync with cloud backend

## Implementation Steps

### Phase 1: Adapter System Foundation

1. Create adapter interface (`src/services/local-store/adapter.ts`)
2. Implement runtime detection (`src/services/local-store/runtime.ts`)
3. Create Dexie adapter wrapper (`src/services/local-store/dexie-adapter.ts`)
4. Create SQLite adapter stub (`src/services/local-store/sqlite-adapter.ts`)
5. Create adapter selection mechanism (`src/services/local-store/index.ts`)

### Phase 2: Tauri SQLite Integration

1. Update Tauri dependencies in `Cargo.toml`
2. Implement SQLite commands in Tauri backend (`src-tauri/src/lib.rs`)
3. Create database schema matching existing Dexie structure
4. Implement CRUD operations for all entity types
5. Implement outbox pattern for offline support

### Phase 3: Repository Layer Adaptation

1. Update existing repositories to use new adapter system
2. Ensure transaction support works correctly
3. Maintain existing API contracts where possible
4. Add proper error handling and fallback mechanisms

### Phase 4: Testing and Validation

1. Create unit tests for adapter selection
2. Test SQLite operations in Tauri environment
3. Verify Dexie operations still work in web environment
4. Test outbox pattern with both adapters
5. Validate sync functionality

### Phase 5: Android Support

1. Add Capacitor SQLite plugin
2. Implement Android SQLite adapter
3. Test cross-platform compatibility
4. Ensure consistent API across all platforms

## Technical Considerations

### Database Schema
- Maintain schema compatibility between Dexie and SQLite
- Use consistent naming conventions
- Handle data type differences between IndexedDB and SQLite
- Ensure proper indexing for performance

### Transaction Support
- Implement proper transaction handling in both adapters
- Handle transaction rollback scenarios
- Ensure data consistency during sync operations

### Error Handling
- Create consistent error types across platforms
- Implement proper error propagation
- Add retry mechanisms for transient failures

### Performance
- Optimize SQLite queries with proper indexing
- Implement connection pooling for Tauri
- Use batch operations where possible
- Monitor memory usage in long-running desktop sessions

## Risk Mitigation

### Data Loss Prevention
- Implement proper backup mechanisms
- Add data validation before writes
- Create recovery procedures for corruption

### Compatibility
- Maintain backward compatibility with existing data
- Test migration paths from old Dexie-only system
- Ensure feature parity across platforms

### Sync Consistency
- Handle conflicts between local and remote data
- Implement proper last-write-wins or merge strategies
- Maintain sync metadata consistency

## Success Criteria

1. Adapter system selects correct implementation based on platform
2. All existing functionality works on web with Dexie
3. Desktop version works with SQLite through Tauri
4. Android version works with SQLite through Capacitor
5. Sync functionality works consistently across all platforms
6. Performance is acceptable on all platforms
7. Error handling is robust and user-friendly

## Next Steps

1. Complete adapter interface and runtime detection
2. Implement basic Tauri SQLite commands
3. Test adapter selection in both web and desktop environments
4. Gradually migrate existing repositories to use new adapter system
5. Add comprehensive test coverage