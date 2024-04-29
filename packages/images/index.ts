import { Feature } from '../../common/Feature';

class ImagesFeature extends Feature {
	enabled: boolean = true;

	name: string = 'images';
}

export const feature = new ImagesFeature();
