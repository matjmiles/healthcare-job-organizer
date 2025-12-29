# Test Infrastructure for Healthcare Admin Jobs Pipeline

This directory contains the test suite for the healthcare administration job collection and filtering pipeline.

## Directory Structure

```
tests/
├── unit/                    # Unit tests for individual components
├── integration/            # Integration tests for full pipeline
├── debug/                  # Debug utilities and interactive testing
├── conftest.py            # Pytest configuration and fixtures
├── run_tests.py          # Test runner script
└── README.md             # This file
```

## Test Categories

### Unit Tests (`tests/unit/`)
Test individual components in isolation:
- `test_education_filters.py` - Education requirement filtering logic
- `test_health_admin_filters.py` - Healthcare administration job identification
- `test_qualifications_extractor.py` - Qualification text extraction
- `test_location_parsing.py` - Location and geographic data parsing

### Integration Tests (`tests/integration/`)  
Test complete workflows:
- `test_pipeline_flow.py` - End-to-end pipeline execution
- `test_api_integration.py` - API fetching and data processing
- `test_data_quality.py` - Output data validation and quality checks

### Debug Utilities (`tests/debug/`)
Interactive debugging and analysis tools:
- `debug_education_logic.py` - Interactive education filter testing
- `debug_pipeline_step_by_step.py` - Step-by-step pipeline execution
- `debug_job_analysis.py` - Individual job analysis and filtering

## Running Tests

### Quick Test Run
```bash
# Run all tests
python tests/run_tests.py

# Run specific category
python tests/run_tests.py --unit
python tests/run_tests.py --integration
```

### Individual Test Files
```bash
# Run specific test file
python -m pytest tests/unit/test_education_filters.py -v

# Run with detailed output
python tests/unit/test_education_filters.py
```

### Debug Mode
```bash
# Interactive education filter debugging
python tests/debug/debug_education_logic.py

# Step-by-step pipeline debugging  
python tests/debug/debug_pipeline_step_by_step.py
```

## Test Reports

Tests generate reports in the following formats:
- **Console Output**: Real-time test results and statistics
- **Test Coverage**: Component coverage analysis
- **Performance Metrics**: Filtering efficiency and processing times
- **Data Quality Reports**: Output validation and accuracy metrics

## VS Code Integration

The test suite integrates with VS Code debugging:
- Use F5 to debug individual test files
- Set breakpoints in test code for detailed inspection
- Debug configurations available in `.vscode/launch.json`

## Adding New Tests

When adding new functionality:
1. Create unit tests for new functions/classes
2. Add integration tests for new workflows
3. Update debug utilities for new filtering logic
4. Update this documentation

## Test Data

Test files use:
- **Synthetic job descriptions** for consistent testing
- **Real API samples** for integration validation  
- **Edge cases** for comprehensive coverage
- **Performance benchmarks** for regression testing