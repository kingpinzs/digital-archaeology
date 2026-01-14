/*
 * M4HDL Parser
 *
 * Parses hardware description files and builds circuits
 */

#define _GNU_SOURCE
#include "circuit.h"
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <strings.h>
#include <ctype.h>

/* Token types */
typedef enum {
    TOK_EOF,
    TOK_IDENT,
    TOK_NUMBER,
    TOK_WIRE,
    TOK_MODULE,
    TOK_ENDMODULE,
    TOK_INPUT,
    TOK_OUTPUT,
    TOK_NOT,
    TOK_AND,
    TOK_OR,
    TOK_NAND,
    TOK_NOR,
    TOK_XOR,
    TOK_XNOR,
    TOK_BUF,
    TOK_DFF,
    TOK_MUX2,
    TOK_NMOS,
    TOK_PMOS,
    TOK_LPAREN,
    TOK_RPAREN,
    TOK_LBRACKET,
    TOK_RBRACKET,
    TOK_COLON,
    TOK_SEMICOLON,
    TOK_COMMA,
    TOK_EQUALS,
    TOK_ARROW,      /* -> */
    TOK_ERROR
} TokenType;

/* Parser state */
typedef struct {
    const char *source;
    const char *pos;
    int line;
    TokenType token;
    char token_str[MAX_NAME_LEN];
    int token_num;
    char error_msg[256];
} Parser;

/* === Lexer === */

static void skip_whitespace(Parser *p) {
    while (*p->pos) {
        if (*p->pos == '\n') {
            p->line++;
            p->pos++;
        } else if (isspace(*p->pos)) {
            p->pos++;
        } else if (*p->pos == '#' || (*p->pos == '/' && p->pos[1] == '/')) {
            /* Comment to end of line */
            while (*p->pos && *p->pos != '\n') p->pos++;
        } else if (*p->pos == '/' && p->pos[1] == '*') {
            /* Block comment */
            p->pos += 2;
            while (*p->pos && !(*p->pos == '*' && p->pos[1] == '/')) {
                if (*p->pos == '\n') p->line++;
                p->pos++;
            }
            if (*p->pos) p->pos += 2;
        } else {
            break;
        }
    }
}

static TokenType next_token(Parser *p) {
    skip_whitespace(p);

    if (*p->pos == '\0') {
        p->token = TOK_EOF;
        return p->token;
    }

    /* Single character tokens */
    switch (*p->pos) {
        case '(': p->pos++; p->token = TOK_LPAREN; return p->token;
        case ')': p->pos++; p->token = TOK_RPAREN; return p->token;
        case '[': p->pos++; p->token = TOK_LBRACKET; return p->token;
        case ']': p->pos++; p->token = TOK_RBRACKET; return p->token;
        case ':': p->pos++; p->token = TOK_COLON; return p->token;
        case ';': p->pos++; p->token = TOK_SEMICOLON; return p->token;
        case ',': p->pos++; p->token = TOK_COMMA; return p->token;
        case '=': p->pos++; p->token = TOK_EQUALS; return p->token;
    }

    /* Arrow -> */
    if (*p->pos == '-' && p->pos[1] == '>') {
        p->pos += 2;
        p->token = TOK_ARROW;
        return p->token;
    }

    /* Number */
    if (isdigit(*p->pos)) {
        char *end;
        if (p->pos[0] == '0' && (p->pos[1] == 'x' || p->pos[1] == 'X')) {
            p->token_num = strtol(p->pos, &end, 16);
        } else if (p->pos[0] == '0' && (p->pos[1] == 'b' || p->pos[1] == 'B')) {
            p->token_num = strtol(p->pos + 2, &end, 2);
        } else {
            p->token_num = strtol(p->pos, &end, 10);
        }
        p->pos = end;
        p->token = TOK_NUMBER;
        return p->token;
    }

    /* Identifier or keyword */
    if (isalpha(*p->pos) || *p->pos == '_') {
        int i = 0;
        while ((isalnum(*p->pos) || *p->pos == '_') && i < MAX_NAME_LEN - 1) {
            p->token_str[i++] = *p->pos++;
        }
        p->token_str[i] = '\0';

        /* Check for keywords */
        if (strcasecmp(p->token_str, "wire") == 0) p->token = TOK_WIRE;
        else if (strcasecmp(p->token_str, "module") == 0) p->token = TOK_MODULE;
        else if (strcasecmp(p->token_str, "endmodule") == 0) p->token = TOK_ENDMODULE;
        else if (strcasecmp(p->token_str, "input") == 0) p->token = TOK_INPUT;
        else if (strcasecmp(p->token_str, "output") == 0) p->token = TOK_OUTPUT;
        else if (strcasecmp(p->token_str, "not") == 0) p->token = TOK_NOT;
        else if (strcasecmp(p->token_str, "and") == 0) p->token = TOK_AND;
        else if (strcasecmp(p->token_str, "or") == 0) p->token = TOK_OR;
        else if (strcasecmp(p->token_str, "nand") == 0) p->token = TOK_NAND;
        else if (strcasecmp(p->token_str, "nor") == 0) p->token = TOK_NOR;
        else if (strcasecmp(p->token_str, "xor") == 0) p->token = TOK_XOR;
        else if (strcasecmp(p->token_str, "xnor") == 0) p->token = TOK_XNOR;
        else if (strcasecmp(p->token_str, "buf") == 0) p->token = TOK_BUF;
        else if (strcasecmp(p->token_str, "dff") == 0) p->token = TOK_DFF;
        else if (strcasecmp(p->token_str, "mux2") == 0) p->token = TOK_MUX2;
        else if (strcasecmp(p->token_str, "nmos") == 0) p->token = TOK_NMOS;
        else if (strcasecmp(p->token_str, "pmos") == 0) p->token = TOK_PMOS;
        else p->token = TOK_IDENT;

        return p->token;
    }

    /* Unknown character */
    snprintf(p->error_msg, sizeof(p->error_msg),
             "Unexpected character '%c' at line %d", *p->pos, p->line);
    p->token = TOK_ERROR;
    return p->token;
}

/* === Parser helpers === */

static bool expect(Parser *p, TokenType tok) {
    if (p->token != tok) {
        snprintf(p->error_msg, sizeof(p->error_msg),
                 "Unexpected token at line %d", p->line);
        return false;
    }
    next_token(p);
    return true;
}

static bool parse_wire_ref(Parser *p, Circuit *c, int *wire_idx, int *bit) {
    /* Parse: name or name[bit] */
    if (p->token != TOK_IDENT) {
        snprintf(p->error_msg, sizeof(p->error_msg),
                 "Expected wire name at line %d", p->line);
        return false;
    }

    *wire_idx = circuit_find_wire(c, p->token_str);
    if (*wire_idx < 0) {
        /* Auto-create wire */
        *wire_idx = circuit_add_wire(c, p->token_str, 1);
    }
    *bit = 0;

    next_token(p);

    /* Optional bit index */
    if (p->token == TOK_LBRACKET) {
        next_token(p);
        if (p->token != TOK_NUMBER) {
            snprintf(p->error_msg, sizeof(p->error_msg),
                     "Expected bit index at line %d", p->line);
            return false;
        }
        *bit = p->token_num;
        next_token(p);
        if (!expect(p, TOK_RBRACKET)) return false;
    }

    return true;
}

/* === Parse statements === */

static bool parse_wire_decl(Parser *p, Circuit *c) {
    /* wire name; or wire [width-1:0] name; */
    next_token(p);  /* skip 'wire' */

    int width = 1;

    /* Check for bus width */
    if (p->token == TOK_LBRACKET) {
        next_token(p);
        if (p->token != TOK_NUMBER) return false;
        int high = p->token_num;
        next_token(p);
        if (!expect(p, TOK_COLON)) return false;
        if (p->token != TOK_NUMBER) return false;
        int low = p->token_num;
        next_token(p);
        if (!expect(p, TOK_RBRACKET)) return false;
        width = high - low + 1;
    }

    /* Wire name */
    if (p->token != TOK_IDENT) {
        snprintf(p->error_msg, sizeof(p->error_msg),
                 "Expected wire name at line %d", p->line);
        return false;
    }

    circuit_add_wire(c, p->token_str, width);
    next_token(p);

    /* Check for initial value */
    if (p->token == TOK_EQUALS) {
        next_token(p);
        if (p->token == TOK_NUMBER) {
            int wire_idx = circuit_find_wire(c, c->wires[c->num_wires - 1].name);
            for (int b = 0; b < width; b++) {
                WireState s = (p->token_num >> b) & 1 ? WIRE_1 : WIRE_0;
                circuit_set_wire(c, wire_idx, b, s);
            }
            next_token(p);
        }
    }

    expect(p, TOK_SEMICOLON);
    return true;
}

static GateType token_to_gate_type(TokenType tok) {
    switch (tok) {
        case TOK_NOT:  return GATE_NOT;
        case TOK_AND:  return GATE_AND;
        case TOK_OR:   return GATE_OR;
        case TOK_NAND: return GATE_NAND;
        case TOK_NOR:  return GATE_NOR;
        case TOK_XOR:  return GATE_XOR;
        case TOK_XNOR: return GATE_XNOR;
        case TOK_BUF:  return GATE_BUF;
        case TOK_DFF:  return GATE_DFF;
        case TOK_MUX2: return GATE_MUX2;
        case TOK_NMOS: return GATE_NMOS;
        case TOK_PMOS: return GATE_PMOS;
        default: return GATE_BUF;
    }
}

static bool parse_gate(Parser *p, Circuit *c) {
    /* gate_type name (input: a b, output: y); */
    GateType type = token_to_gate_type(p->token);
    next_token(p);

    /* Instance name */
    if (p->token != TOK_IDENT) {
        snprintf(p->error_msg, sizeof(p->error_msg),
                 "Expected gate name at line %d", p->line);
        return false;
    }
    char name[MAX_NAME_LEN];
    strncpy(name, p->token_str, MAX_NAME_LEN - 1);
    next_token(p);

    if (!expect(p, TOK_LPAREN)) return false;

    int gate_idx = circuit_add_gate(c, type, name);

    /* Parse port connections */
    while (p->token != TOK_RPAREN && p->token != TOK_EOF) {
        bool is_input = false;
        bool is_output = false;

        if (p->token == TOK_INPUT) {
            is_input = true;
            next_token(p);
            if (!expect(p, TOK_COLON)) return false;
        } else if (p->token == TOK_OUTPUT) {
            is_output = true;
            next_token(p);
            if (!expect(p, TOK_COLON)) return false;
        }

        /* Parse wire references */
        while (p->token == TOK_IDENT) {
            int wire_idx, bit;
            if (!parse_wire_ref(p, c, &wire_idx, &bit)) return false;

            if (is_input) {
                circuit_gate_add_input(c, gate_idx, wire_idx, bit);
            } else if (is_output) {
                circuit_gate_add_output(c, gate_idx, wire_idx, bit);
            }
        }

        if (p->token == TOK_COMMA) {
            next_token(p);
        }
    }

    if (!expect(p, TOK_RPAREN)) return false;
    expect(p, TOK_SEMICOLON);

    return true;
}

/* === Main parser === */

bool circuit_parse(Circuit *c, const char *source) {
    Parser parser;
    parser.source = source;
    parser.pos = source;
    parser.line = 1;
    parser.error_msg[0] = '\0';

    next_token(&parser);

    while (parser.token != TOK_EOF && parser.token != TOK_ERROR) {
        switch (parser.token) {
            case TOK_WIRE:
                if (!parse_wire_decl(&parser, c)) {
                    c->error = true;
                    strncpy(c->error_msg, parser.error_msg, sizeof(c->error_msg));
                    return false;
                }
                break;

            case TOK_NOT:
            case TOK_AND:
            case TOK_OR:
            case TOK_NAND:
            case TOK_NOR:
            case TOK_XOR:
            case TOK_XNOR:
            case TOK_BUF:
            case TOK_DFF:
            case TOK_MUX2:
            case TOK_NMOS:
            case TOK_PMOS:
                if (!parse_gate(&parser, c)) {
                    c->error = true;
                    strncpy(c->error_msg, parser.error_msg, sizeof(c->error_msg));
                    return false;
                }
                break;

            case TOK_MODULE:
                /* TODO: Implement module parsing */
                snprintf(c->error_msg, sizeof(c->error_msg),
                         "Module definitions not yet supported");
                c->error = true;
                return false;

            default:
                snprintf(c->error_msg, sizeof(c->error_msg),
                         "Unexpected token '%s' at line %d",
                         parser.token_str, parser.line);
                c->error = true;
                return false;
        }
    }

    if (parser.token == TOK_ERROR) {
        c->error = true;
        strncpy(c->error_msg, parser.error_msg, sizeof(c->error_msg));
        return false;
    }

    return true;
}

bool circuit_load_file(Circuit *c, const char *filename) {
    FILE *f = fopen(filename, "r");
    if (!f) {
        snprintf(c->error_msg, sizeof(c->error_msg),
                 "Cannot open file: %s", filename);
        c->error = true;
        return false;
    }

    fseek(f, 0, SEEK_END);
    long size = ftell(f);
    fseek(f, 0, SEEK_SET);

    char *source = malloc(size + 1);
    if (!source) {
        fclose(f);
        snprintf(c->error_msg, sizeof(c->error_msg), "Out of memory");
        c->error = true;
        return false;
    }

    size_t bytes_read = fread(source, 1, size, f);
    source[bytes_read] = '\0';
    fclose(f);

    bool result = circuit_parse(c, source);
    free(source);

    return result;
}
