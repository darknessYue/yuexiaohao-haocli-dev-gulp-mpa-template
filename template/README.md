
# GULP-MPA

gulp + webpack 多页面构建方案


## Authors

- [@Rio](https://www.github.com/darknessYue)


## Usage

#### install

```
  npm install gulp-mpa -save-dev
```
or
```
  yarn gulp-mpa --dev
```
#### change scripts in package.json

```
  "scripts": {
      "dev": "gulp-mpa dev",
      "build": "gulp-mpa build"
  }
```


## Tree
```
project
│  .gitignore
│  package.json
│       
├─public
│       
├─temp
│   
├─dist  
│              
└─src
    │  index.html
    │  
    └─assets
        ├─css  (.scss)
        ├─fonts
        ├─images
        └─js
```