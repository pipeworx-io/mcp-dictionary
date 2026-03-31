# @pipeworx/mcp-dictionary

MCP server for English dictionary — definitions, phonetics, and examples.

## Tools

| Tool | Description |
|------|-------------|
| `define_word` | Look up a word — definitions, phonetics, part of speech, and usage examples |
| `get_synonyms` | Get synonyms and antonyms for a word |

## Quick Start

Add to your MCP client config:

```json
{
  "mcpServers": {
    "dictionary": {
      "url": "https://gateway.pipeworx.io/dictionary/mcp"
    }
  }
}
```

Or run via CLI:

```bash
npx pipeworx use dictionary
```

## License

MIT
