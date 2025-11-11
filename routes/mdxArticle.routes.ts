import { Router } from "express";
import { inject, injectable } from "inversify";
import { MDXArticleControllerImpl } from "#src/modules/mdxArticles/controllers/mdxArticle.controller.js";
import { TYPES } from "#src/di/types.js";
import { IRouter } from "#src/types/contracts/index.js";
import { prepareTempDir } from "#src/middlewares/prepareTempDir.middleware.js";
import { upload } from "#src/infrastructure/storage/multer.store.js";

@injectable()
export class MDXArticleRouter implements IRouter {
    private router: Router

    constructor (
        @inject(TYPES.MDXArticleController) private mdxArticleController: MDXArticleControllerImpl
    ) {
        this.router = Router()
        this.setup()
    }
    
    async setup(): Promise<void> {
        this.router.post('/filtered', this.mdxArticleController.getFilteredMDXArticles.bind(this.mdxArticleController))
        this.router.get('/:id', this.mdxArticleController.getMDXArticleById.bind(this.mdxArticleController))
        this.router.get('/content/:id', this.mdxArticleController.getMDXArticleContent.bind(this.mdxArticleController))
        this.router.get('/search/:content', this.mdxArticleController.searchMDXArticleByContent.bind(this.mdxArticleController))

        this.router.post('/', prepareTempDir, upload.array('files'), this.mdxArticleController.craeteMDXArticle.bind(this.mdxArticleController))

        this.router.put('/update', prepareTempDir, upload.array('files'), this.mdxArticleController.updateMDXArticle.bind(this.mdxArticleController))

        this.router.delete('/bulk', this.mdxArticleController.bulkDeleteMDXArticles.bind(this.mdxArticleController))
    }

    getRouter(): Router {
        return this.router
    }
}