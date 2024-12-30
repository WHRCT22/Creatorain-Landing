import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import chalk from 'chalk';
import bodyParser from 'body-parser';
import fs from 'fs/promises';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// 设置EJS为视图引擎
app.set('view engine', 'ejs');
console.log(chalk.green('渲染引擎设置完毕'));

// 使用body-parser中间件来解析POST请求的body
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

// 设置视图目录
app.set('views', path.join(__dirname, 'html'));
console.log(chalk.green('视图目录设置完毕'));

// 配置静态文件目录
app.use(express.static(path.join(__dirname, 'html')));
console.log(chalk.green('静态文件目录设置完毕'));

// 异步读取插件文件内容的函数
async function readPluginFile(filePath) {
  try {
    const content = await fs.readFile(filePath, 'utf8');
    console.log(chalk.green(`${path.basename(filePath)}部分读取完毕`));
    return content;
  } catch (err) {
    console.error(chalk.red(`Error reading ${path.basename(filePath)} file: ${err.message}`));
    return ''; // 返回空字符串以避免模板渲染错误
  }
}

// 处理所有以/开头的路由请求，但跳过包含static目录的路径
app.use((req, res, next) => {
  if (req.path.includes('/static/')) {
    return next(); // 如果路径包含/static/，跳过渲染
  }
  const requestPath = req.path;
  const viewPath = path.join(__dirname, 'html', `${requestPath}.ejs`);

  Promise.all([
    readPluginFile(path.join(__dirname, 'plugin', 'header.html')),
    readPluginFile(path.join(__dirname, 'plugin', 'footer.html')),
    readPluginFile(path.join(__dirname, 'plugin', 'swiper.html')),
    readPluginFile(path.join(__dirname, 'plugin', 'pricingform.html')),
    readPluginFile(path.join(__dirname, 'plugin', 'linkres.html')),
  ]).then(([headerContent, footerContent, swiperContent, pricingformContent, linkresContent]) => {
    console.log(chalk.green('渲染页面中...'));
    res.render(viewPath, { header: headerContent, footer: footerContent, pricingform: pricingformContent, swiper: swiperContent, linkres: linkresContent})
      .then(renderedHtml => res.send(renderedHtml))
      .catch(err => {
        console.error(chalk.red(`Error rendering ${viewPath}.ejs: ${err.message}`));
        next();
      });
  }).catch(next); // 如果Promise.all失败，继续处理下一个中间件或路由
});

// 启动服务器
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(chalk.yellow(`服务器已启动，监听端口 ${PORT}`));
});
