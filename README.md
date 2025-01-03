# Personal Website Maintenance Manual

## TL;DR
The key components of building this website are the following:
| Component   | Description                                                                                                              | Configuration                             |
| :---------- | :----------------------------------------------------------------------------------------------------------------------- | :---------------------------------------- |
| `Bootstrap` | A CSS framework that is used to build the website. A local copy is heavily modified to fit the needs of the website. | `/assets/bootstrap/css/bootstrap.min.css` |
| `Jekyll` | A static site generator that is used to build the website. It is used to populate data and generate HTML files from the markdown files. | `_config.yml` |
| `npm` | A package manager that is used to install and manage the dependencies of the website, which includes things like `three.js`, `tocbot`, and `jquery`. | `package.json` |
| `webpack` | A module bundler that is used to bundle the JavaScript files and CSS files together. Most importantly, it is used to handle the messy import/export of the JavaScript files. | `webpack.config.js` |

## Automated Workflow
For customization of the workflow, please refer to the `package.json` file, under the `scripts` section.

* Build the website
    ```bash
    npm run build
    ```



* Serve the website locally, preview **without** hot-reloading enabled. Just a static serving of `_site/`
    ```bash
    npm run serve
    ```

* (Beta) Deploy the website to GitHub Pages
    ```bash
    npm run deploy
    ```

* Serve the website locally, preview **with** hot-reloading enabled. But be wary of the `jekyll` rebuilding process, which can purge the `_site/assets/js` directory, removing things built by `webpack`.
    ```bash
    npm run jekyll:watch
    ```