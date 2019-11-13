# CSS Vars To Local Styles

This plugin imports design tokens from a CSS or SCSS file and convert them to local styles.

**Currently only supports colors.**

## Usage

The plugin gives the option to only override existing styles or to override existing and add missing ones.

It also gives the option to strip the "--" prefix of the CSS variables name from the local styles name.

## Installation

Currently only in dev mode. Follow instructions [here](https://www.figma.com/plugin-docs/setup/).

Because it has some dependencies, you still have to run:

    npm install

## Run development

    npx webpack --mode=development --watch