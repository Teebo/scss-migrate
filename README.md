# Getting Started With SCSS-Migrate

A schematic to migrate from CSS to SCSS stylesheet format for an Angular CLI project

### Installation

`npm i --save-dev schematics-scss-migrate`

### Usage

In your Angular CLI project, run `ng g schematics-scss-migrate:scss-migrate`, this will rename all the stylesheets in the
`src` folder recursively and also alter the `styleUrls` value to point to the new file names for the stylesheets.

It also updates the component styles schematics value in the `angular.json` file or creates one if the schematic does not exist.
And renames `styles.css` references to `.scss` in the `angular.json` file

### Notes

Try first with the `dry-run=true` flag
