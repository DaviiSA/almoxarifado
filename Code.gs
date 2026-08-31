/**
 * Code.gs — serve a página única do aplicativo.
 */
function doGet() {
  return HtmlService.createTemplateFromFile('Index')
    .evaluate()
    .setTitle('Almoxarifado')
    .addMetaTag('viewport', 'width=device-width, initial-scale=1')
    .setFaviconUrl('https://www.gstatic.com/images/branding/product/1x/sheets_48dp.png');
}

/** Usado pelo template HTML para incluir Styles.html e Script.html dentro de Index.html. */
function include(filename) {
  return HtmlService.createHtmlOutputFromFile(filename).getContent();
}
