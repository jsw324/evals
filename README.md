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
│  Dataset Loader │───▶│ Template Manager│───▶│ Evaluation      │
│     Agent       │    │     Agent       │    │ Runner Agent    │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                                                        │
                                                        ▼
                       ┌─────────────────┐    ┌─────────────────┐
                       │  LLM as Judge   │◀───│   Claude API    │
                       │     Agent       │    │  (integrated)   │
                       └─────────────────┘    └─────────────────┘
```

## 🏗️ Agent Structure

### Core Agents

- **`dataset_loader`**: Loads and validates ground truth evaluation datasets
- **`template_manager`**: Handles prompt templates with variable substitution
- **`evaluation_runner`**: Executes evaluation cases, coordinates model testing, and communicates directly with AI models (Claude, GPT, etc.)
- **`llm_as_judge`**: Uses Claude to intelligently compare model outputs against expected results with 0-100 similarity scoring

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

Send a request to the `dataset_loader` agent:

```json
{
  "evaluation_id": "state_capitals_eval_001",
  "dataset_path": "datasets/state_capitals.json",
  "format": "query_response_pairs",
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
    "similarity_threshold": 80,
    "judge_model": "claude-3-5-haiku-latest"
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
    "average_similarity_score": 87.2,
    "high_similarity_count": 42,
    "medium_similarity_count": 6,
    "low_similarity_count": 2,
    "high_similarity_rate": 0.84
  },
  "detailed_results": [...],
  "model_config": {...}
}
```

## 🔄 Data Flow

The evaluation system uses the Agentuity key-value store for agent communication:

1. **Initial Request** → `dataset_loader` agent
2. **Dataset Loading** → Key: `eval_run_{id}_dataset`
3. **Template Processing** → Key: `eval_run_{id}_processed`
4. **Evaluation Execution** → Key: `eval_run_{id}_results`
5. **LLM Judging** → Key: `eval_run_{id}_comparison` (Final structured results)

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
agentuity env set DEFAULT_JUDGE_MODEL=claude-3-5-haiku-latest
agentuity env set DEFAULT_SIMILARITY_THRESHOLD=80
```

## 📁 Project Structure

```
├── agents/
│   ├── dataset_loader/         # Loads evaluation datasets
│   ├── template_manager/       # Manages prompt templates
│   ├── evaluation_runner/      # Executes evaluation cases and communicates with AI models
│   └── llm_as_judge/          # Uses Claude to judge response similarity (0-100 scoring)
├── datasets/                   # Ground truth datasets
├── templates/                  # Prompt templates
├── .venv/                      # Virtual environment
├── pyproject.toml             # Dependencies
├── server.py                  # Server entry point
└── agentuity.yaml            # Project configuration
```

## 🎯 LLM-as-Judge Evaluation

The system uses Claude as an intelligent judge to evaluate response similarity:

- **Semantic Understanding**: Understands context, synonyms, and meaning beyond simple string matching
- **Flexible Scoring**: Provides 0-100 similarity scores with detailed reasoning
- **Context Aware**: Considers the original question, expected response, and actual response
- **Consistent**: Uses low temperature settings for reliable, repeatable judgments
- **Explainable**: Provides reasoning for each similarity score

## 🌐 Deployment

Deploy your evaluation system to Agentuity Cloud:

```bash
agentuity deploy
```

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
