import { getLocalStoreAdapter } from '@/services/local-store/index'
import type { LocalStoreAdapter } from '@/services/local-store/adapter'

// This is a simple test to verify the adapter selection
async function testAdapterSelection(): Promise<void> {
  try {
    const adapter: LocalStoreAdapter = getLocalStoreAdapter()
    const health = await adapter.health()
    
    console.log('Adapter target:', health.target)
    console.log('Adapter status:', health.status)
    console.log('Adapter message:', health.message)
    
    // In a real test, you would perform assertions here
    // For now, we just log the results
  } catch (error) {
    console.error('Error testing adapter selection:', error)
  }
}

// Run the test
testAdapterSelection()