var TAG = "beautifier";

var manifest = {
  "settings": {
    "enableInlineDiffs": {
      "type": "bool",
      "default": true,
      "description": "Enable inline diffs."
    },
    "createViewAllButtons": {
      "type": "bool",
      "default": true,
      "description": "Create buttons to open all diffs.",
      "requires": "enableInlineDiffs"
    },
    "rewriteUnifiedLinks": {
      "type": "bool",
      "default": true,
      "description": "Rewrite unified diff links to side-by-side links."
    },
    "hideBaseUrl": {
      "type": "bool",
      "default": true,
      "description": "Hide base URL section."
    },
    "enableAnimations": {
      "type": "bool",
      "default": true,
      "description": "Animate showing/hiding inline diffs."
    },
    "autoSetColumnWidth": {
      "type": "bool",
      "default": true,
      "description": "Automatically set the column width in inline diff views."
    },
    "columnWidthMap": {
      "type": "dict",
      "default": { "java": 100, "gyp": 100, "gypi": 100, "xml": 100 },
      "description": "How many columns for each filetype."
    },
    "codeFont": {
      "type": "string",
      "default": "Inconsolata",
      "description": "Font for code lines."
    },
    "codeFontEnabled": {
      "type": "bool",
      "default": false,
      "description": "Change font used for code lines."
    },
    "colorBlindMode": {
      "type": "bool",
      "default": false,
      "description": "Make diff color coding more colorblind friendly (maybe)."
    },
    "changeReplaceColor": {
      "type": "bool",
      "default": true,
      "description": "Use a different color for replace sections."
    },
    "loadLimit": {
      "type": "number",
      "default": 2,
      "description": "Maximum simultaneous frame loads."
    },
    "queueThrottle": {
      "type": "number",
      "default": 250,
      "description": "Delay between successive frame loads."
    },
    "fixDiffSelection": {
      "type": "bool",
      "default": true,
      "description": "Fix copy/paste in diff views."
    }
  }
}
