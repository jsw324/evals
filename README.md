# 🤖 AI Agent Evaluation System

<div align="center">
    <img src="https://raw.githubusercontent.com/agentuity/cli/refs/heads/main/.github/Agentuity.png" alt="Agentuity" width="100"/> <br/>
    <strong>Multi-Agent Evaluation Framework</strong> <br/>
<br />
</div>

Welcome to the Agentuity AI Agent Evaluation System! This project provides a comprehensive framework for evaluating AI models using a multi-agent architecture that orchestrates dataset loading, prompt templating, model execution, and result analysis.

## 🎯 Overview

This evaluation system uses multiple specialized agents to create a robust, scalable framework for testing AI models against ground truth datasets. Each agent has a discrete task and can pass information to others through the Agentuity key-value store.

### System Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│  Dataset Loader │───▶│ Template Manager│───▶│ Batch Processor │
│     Agent       │    │     Agent       │    │     Agent       │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                                                        │
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│ Report Generator│◀───│ Metrics Calc.   │◀───│ Evaluation      │
│     Agent       │    │     Agent       │    │ Runner Agent    │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                                                        │
                       ┌─────────────────┐    ┌─────────────────┐
                       │ Response Comp.  │◀───│ Model Interface │
                       │     Agent       │    │     Agent       │
                       └─────────────────┘    └─────────────────┘
```

## 🏗️ Agent Structure

### Core Agents

- **`dataset_loader`**: Loads and validates ground truth evaluation datasets
- **`template_manager`**: Handles prompt templates with variable substitution
- **`batch_processor`**: Orchestrates evaluation runs across multiple test cases
- **`evaluation_runner`**: Executes individual evaluation cases
- **`model_interface`**: Communicates with various AI models (Claude, GPT, etc.)
- **`response_comparator`**: Compares model outputs against expected results
- **`metrics_calculator`**: Computes accuracy, similarity scores, and other metrics
- **`report_generator`**: Produces comprehensive evaluation reports

## 📋 Prerequisites

Before you begin, ensure you have the following installed:

- **Python**: Version 3.10 or higher
- **UV**: Version 0.5.25 or higher ([Documentation](https://docs.astral.sh/uv/))
- **Agentuity CLI**: Latest version

## 🚀 Getting Started

### Authentication

```bash
agentuity login
```

### Development Mode

Run the evaluation system in development mode:

```bash
agentuity dev
```

Or start locally without the console:

```bash
uv run server.py
```

## 📊 Usage

### 1. Prepare Your Dataset

Create a ground truth dataset in JSON format:

```json
[
  {
    "query": "What is the capital of New York?",
    "response": "Albany"
  },
  {
    "query": "What is the capital of California?", 
    "response": "Sacramento"
  }
]
```

### 2. Create an Evaluation Request

Send a request to the `batch_processor` agent:

```json
{
  "evaluation_id": "state_capitals_eval_001",
  "dataset": {
    "path": "datasets/state_capitals.json",
    "format": "query_response_pairs"
  },
  "prompt_template": {
    "template": "You are an expert on state capitals. Answer the following question: {{query}}",
    "variables": ["query"]
  },
  "model_config": {
    "model_name": "claude-3-5-sonnet-latest",
    "max_tokens": 100,
    "temperature": 0.1
  },
  "evaluation_settings": {
    "comparison_method": "exact_match",
    "batch_size": 10,
    "output_format": "detailed_report"
  }
}
```

### 3. Review Results

The system will generate a comprehensive evaluation report:

```json
{
  "evaluation_id": "state_capitals_eval_001",
  "summary": {
    "total_cases": 50,
    "accuracy": 0.94,
    "avg_response_time": 1.2
  },
  "detailed_results": [...],
  "model_config": {...}
}
```

## 🔄 Data Flow

The evaluation system uses the Agentuity key-value store for agent communication:

1. **Initial Request** → `batch_processor` agent
2. **Dataset Loading** → Key: `eval_run_{id}_dataset`
3. **Template Processing** → Key: `eval_run_{id}_template`
4. **Individual Cases** → Key: `eval_run_{id}_case_{case_id}`
5. **Aggregated Results** → Key: `eval_run_{id}_final`

## 🛠️ Configuration

### Environment Variables

Set up API keys for different models:

```bash
agentuity env set --secret ANTHROPIC_API_KEY=your_key_here
agentuity env set --secret OPENAI_API_KEY=your_key_here
```

### Evaluation Settings

Configure default evaluation parameters:

```bash
agentuity env set DEFAULT_MODEL=claude-3-5-sonnet-latest
agentuity env set DEFAULT_BATCH_SIZE=10
agentuity env set DEFAULT_COMPARISON_METHOD=exact_match
```

## 📁 Project Structure

```
├── agents/
│   ├── dataset_loader/         # Loads evaluation datasets
│   ├── template_manager/       # Manages prompt templates
│   ├── batch_processor/        # Orchestrates evaluations
│   ├── evaluation_runner/      # Runs individual cases
│   ├── model_interface/        # Interfaces with AI models
│   ├── response_comparator/    # Compares responses
│   ├── metrics_calculator/     # Calculates metrics
│   └── report_generator/       # Generates reports
├── datasets/                   # Ground truth datasets
├── templates/                  # Prompt templates
├── reports/                    # Generated evaluation reports
├── .venv/                      # Virtual environment
├── pyproject.toml             # Dependencies
├── server.py                  # Server entry point
└── agentuity.yaml            # Project configuration
```

## 🎯 Comparison Methods

The system supports multiple comparison methods:

- **`exact_match`**: Exact string matching
- **`semantic_similarity`**: Vector similarity comparison
- **`regex_match`**: Pattern-based matching
- **`custom`**: User-defined comparison functions

## 🌐 Deployment

Deploy your evaluation system to Agentuity Cloud:

```bash
agentuity deploy
```

## 📖 Advanced Features

### Custom Metrics

Extend the `metrics_calculator` agent to support custom evaluation metrics.

### Multi-Model Comparison

Run evaluations across multiple models simultaneously for comparative analysis.

### Streaming Evaluations

Process large datasets with streaming evaluation capabilities.

## 🆘 Troubleshooting

If you encounter issues:

1. Check agent logs in the Agentuity Console
2. Verify your dataset format matches the expected schema
3. Ensure all required environment variables are set
4. Join our [Discord community](https://discord.com/invite/vtn3hgUfuc) for support

## 📚 Documentation

- [Agentuity Python SDK](https://agentuity.dev/SDKs/python)
- [Agent Development Guide](https://agentuity.dev/guides/agents)
- [Evaluation Best Practices](https://agentuity.dev/guides/evaluation)

## 📝 License

This project is licensed under the terms specified in the LICENSE file.
