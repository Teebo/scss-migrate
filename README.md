# Getting Started With SCSS-Migrate

A schematic to migrate from CSS to SCSS (or vice versa) stylesheet format for an Angular CLI project

![alt text](https://miro.medium.com/max/890/1*ic7BnzH8YRYC6FDLQ8jetg.png)
### Installation

`npm i --save-dev schematics-scss-migrate`

Or using the CLI

`ng add schematics-scss-migrate`

Note that the `ng add` command still adds the package to the devDependencies

### Usage

In your Angular CLI project, run `ng g schematics-scss-migrate:scss-migrate`.

This will do the following in the consuming project:

- Rename all the stylesheets in the `src` folder recursively
- Alter the `styleUrls` in respective component classes to point to the new file names for stylesheets
- Updates the **component styles schematics** value in the `angular.json` file or creates one if the schematic does not exist, and
- Renames all `styles.css` references to `styles.scss` in the `angular.json` file

### Notes

Try first with the `dry-run=true` flag
