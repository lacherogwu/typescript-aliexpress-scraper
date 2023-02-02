import * as aliexpressApi from './aliexpress-api.js';
import fs from 'fs/promises';

console.log('Started');

const SEARCH_TERM = 'Toys';
const NUMBER_OF_PAGES = 60;
const EXPORTED_FILE_NAME = `./dumps/${SEARCH_TERM.toLowerCase()}-${NUMBER_OF_PAGES}-products.json`;
const products = await aliexpressApi.searchProductsPagination({
	text: SEARCH_TERM,
	numberOfPages: NUMBER_OF_PAGES,
	minPrice: 500,
	maxPrice: 2000,
});

const existedFile = await getExistedFile();
if (existedFile) {
	products.push(...existedFile);
}

const uniqueProducts = aliexpressApi.getUniqueProducts(products);
const roundProductsPrice = aliexpressApi.roundProductsPrices(uniqueProducts);
const priceMap = aliexpressApi.getPriceMap(roundProductsPrice);

await printReportFile(roundProductsPrice, priceMap);
await exportProductsFile(roundProductsPrice);

async function printReportFile(products: aliexpressApi.Product[], priceMap: Map<number, number>): Promise<void> {
	let output = `Search term: ${SEARCH_TERM}\n`;
	output += `Number of products: ${products.length}\n`;
	output += '\nPrice map:\n';
	priceMap.forEach((value, key) => {
		output += `Price: ${key}, Count: ${value}\n`;
	});

	const fileName = `./dumps/${SEARCH_TERM.toLowerCase()}-report.txt`;
	await fs.writeFile(fileName, output);
}

async function exportProductsFile(products: aliexpressApi.Product[]) {
	await fs.writeFile(EXPORTED_FILE_NAME, JSON.stringify(products, null, 2));
}

async function getExistedFile(): Promise<aliexpressApi.Product[] | undefined> {
	try {
		const file = await fs.readFile(EXPORTED_FILE_NAME, 'utf-8');
		return JSON.parse(file);
	} catch {}
}
