import axios, { AxiosInstance } from 'axios';

const client = axios.create({
	baseURL: 'https://www.aliexpress.com',
	headers: {
		'content-type': 'application/json;charset=UTF-8',
		cookie: `ali_apache_id=33.3.34.136.1672340974542.222615.6; xman_f=dcLvSLKz3jYRXQoj/x0eaTETk2ke0e87YPcsn55qgJGFrGT3c5pvpsi+HVglHG5J5JygzYGkGDukaLZKW/4MmsH5pWxqrvmNqrjyvtkPz2LSlHmbvMuPmg==; xman_t=LXUbL4m9oSalXBTS/FMjXpREEbZczbBZ0UhwLo+01hpiQgQ3ukydbVFp6w6M3dTj; ali_apache_track=; e_id=pt80; aep_usuc_f=site=glo&c_tp=EUR&ups_d=0|0|0|0&ups_u_t=&region=CY&b_locale=en_US&ae_u_p_s=1; intl_locale=en_US; acs_usuc_t=x_csrf=1aefnd51370ju&acs_rt=9e73273a314741f68631d883c0800976; cna=Hn9hHNSMJHICAdWVpv1VyQ0C; ali_apache_tracktmp=; XSRF-TOKEN=791cfaad-19ad-4e4b-b7f3-f94286612d42; aep_history=keywords^keywords	product_selloffer^product_selloffer	1005004686746167; JSESSIONID=0788C3CCD08349E6119844DEC8F77FC4; xman_us_f=x_locale=en_US&x_l=0&x_c_chg=0&acs_rt=0e2b68e001ba43b587641edfcd032310; _m_h5_tk=8636385300adce0bae649c7c00b0abe9_1675288136267; _m_h5_tk_enc=9045527d69956c3a962464fd001435eb; AKA_A2=A; tfstk=cMxOBV9aVvetRIlcYG33uFrBbQ9OaNMOTR6TD3-4EEmQDrVuas2Dq3dGvV1Na1Hd.; l=fBNKshArTnhdiJosBO5Churza7795CRf5sPzaNbMiIEGC6FlwWvTpGtQmNwNrKKRRWXPMeYw4FwW5HJtxeo3JPDfnSI97tJ_ZBKBCeTC582bY; isg=BAIC8CAj1Qc_CcmsmXi6LewtUw5k0wbtPHss3EwfyHV6n6sZM2KG_UGdT4Pjz36F; intl_common_forever=D1fKTcGrbVyb+mKVCmZPJl3OQsALP2qcfbb06FzwEkTUBQynCnm+qA==`,
	},
});

export type Product = {
	productId: string;
	image: string;
	title: string;
	price: number;
	reference: string;
};
function formatResponse(response: any): Product[] {
	const itemList = response?.data?.result?.mods?.itemList?.content;

	if (!itemList) return [];
	const products: Product[] = [];

	for (const item of itemList) {
		const productId = item?.productId;
		const image = `https:${item?.image?.imgUrl}`;
		const title = item?.title?.displayTitle;
		const price = item?.prices?.salePrice?.minPrice;
		const reference = `https://www.aliexpress.com/item/${productId}.html`;

		if (!productId || !image || !title || !price || !reference) {
			console.log('ALERT!!');
			continue;
		}
		products.push({
			productId,
			image,
			title,
			price,
			reference,
		});
	}

	return products;
}

export type SearchProductsPayload = {
	text: string;
	minPrice?: number;
	maxPrice?: number;
	page?: number;
};

export async function searchProducts(payload: SearchProductsPayload): Promise<Product[]> {
	const { text, minPrice = 0, maxPrice = 50, page = 1 } = payload;

	const response = await client.post('/fn/search-pc/index', {
		pageVersion: '984c9a58b6d16e5d8c31de9b899f058a',
		target: 'root',
		data: {
			SearchText: text,
			catId: '0',
			g: 'y',
			initiative_id: 'AS_20230201104820',
			maxPrice: `${maxPrice}`,
			minPrice: `${minPrice}`,
			spm: 'a2g0o.productlist.1000002.0',
			trafficChannel: 'main',
			origin: 'y',
			page: `${page}`,
		},
		eventName: 'onChange',
		dependency: [],
	});

	return formatResponse(response.data);
}

export async function searchProductsPagination(payload: SearchProductsPayload & { numberOfPages: number }): Promise<Product[]> {
	const products: Product[] = [];
	for (let i = 1; i <= payload.numberOfPages; i++) {
		const response = await searchProducts({ text: payload.text, page: i, minPrice: payload.minPrice, maxPrice: payload.maxPrice });
		products.push(...response);
	}
	return products;
}

export function getUniqueProducts(products: Product[]): Product[] {
	const uniqueProducts: Product[] = [];
	const productIds = new Set();

	for (const product of products) {
		if (!productIds.has(product.productId)) {
			productIds.add(product.productId);
			uniqueProducts.push(product);
		}
	}

	return uniqueProducts;
}

export function getPriceMap(products: Product[]): Map<number, number> {
	const _products = structuredClone(products);

	_products.sort((a, b) => a.price - b.price);
	const priceMap = new Map<number, number>();

	for (const product of _products) {
		const price = product.price;
		const count = priceMap.get(price) || 0;
		priceMap.set(price, count + 1);
	}

	return priceMap;
}

export function roundProductsPrices(products: Product[]): Product[] {
	const _products = structuredClone(products);

	for (const product of _products) {
		product.price = Math.round(product.price);
	}

	return _products;
}
