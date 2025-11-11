import { Request, Response } from "express";
import { inject, injectable } from "inversify";
import { status } from "#src/consts/index.js";
import { TYPES } from "#src/di/types.js";
import { IMDXArticleService } from "#src/types/contracts/services/mdxArticles/mdxArticle.service.interface.js";
import { MDXArticleFiltersSchema } from "../schemas/mdxArticle/MDXArticleFilters.schema.js";
import { MDXArticleCreateSchema } from "../schemas/mdxArticle/MDXArticlePatch.schema.js";
import { SendError, SendResponse } from "#src/lib/http/index.js";
import { ValidateObjectFieldsNotNull } from "#src/shared/validations/objectFieldsNotNull.validate.js";
import { ValidateId } from "#src/shared/validations/ids/id.validate.js";
import { ValidateIdArray } from "#src/shared/validations/ids/idArray.validate.js";
import { ApiError } from "#src/shared/ApiError/ApiError.js";
import { MDXArticleUpdateSchema } from "../schemas/mdxArticle/MDXArticleUpdate.schema.js";
import { FileConfig } from "#src/types/interfaces/files/FileConfig.interface.js";

@injectable()
export class MDXArticleControllerImpl {
    constructor(
        @inject(TYPES.MDXArticleService) private mdxArticleService: IMDXArticleService
    )  {}

    async getMDXArticleById(req: Request, res: Response) {
        try {
            const id = Number(req.params.id)

            ValidateId(id)

            const mdxArticle = await this.mdxArticleService.getMDXArticleById(id)

            SendResponse(res, {
                cases: [
                    { 
                        condition: () => true,
                        status: status.OK,
                        message: 'MDX Article fetched'
                    }
                ],
                data: mdxArticle
            })
        } catch (e) {
            SendError(res, e)
        }
    }

    /**
     * Будет POST запросом, тк в query сомнительно передавать данные для фильтрации, 
     * ведь они могут быть достаточно большими
     * @param req 
     * @param res 
     */
    async getFilteredMDXArticles(req: Request, res: Response) {
        try {
            const filters = req.body

            ValidateObjectFieldsNotNull(filters)
            const validatedFilters = MDXArticleFiltersSchema.parse(filters)

            const mdxArticles = await this.mdxArticleService.getFilteredMDXArticles(validatedFilters)

            SendResponse(res, {
                cases: [
                    {
                        condition: () => true,
                        status: 200,
                        message: mdxArticles.length !== 0 ? 'MDX Articles fetched' : 'No candidates found'
                    }
                ],
                data: mdxArticles
            })
        } catch (e) {
            SendError(res, e)
        }
    }

    async searchMDXArticleByContent(req: Request, res: Response) {
        try {
            const content = String(req.params.content)

            if (!content) throw ApiError.BadRequest(`Content is null`)
                
            const mdxArticle = await this.mdxArticleService.searchMDXArticleByContent(content)
    
            SendResponse(res, {
                cases: [
                    {
                        condition: () => true,
                        status: status.OK,
                        message: 'MDX Article fetched'
                    }
                ],
                data: mdxArticle
            })
        } catch (e) {
            SendError(res, e)
        }
    }

    async getMDXArticleContent(req: Request, res: Response) {
        try {
            const id = Number(req.params.id)

            ValidateId(id)

            const mdxArticle = await this.mdxArticleService.getMDXArticleContent(id)

            SendResponse(res, {
                cases: [
                    {
                        condition: () => true,
                        status: status.OK,
                        message: 'MDX Article fetched'
                    }
                ],
                data: mdxArticle
            })
        } catch (e) {
            SendError(res, e)
        }
    }

    async craeteMDXArticle(req: Request, res: Response) {
        try {
            if (!req.tempUploadDir) {
                throw ApiError.Internal('Server has not prepared necessary dirs')
            }
            const options = JSON.parse(req.body.data)

            ValidateObjectFieldsNotNull(options)
            const validatedOptions = MDXArticleCreateSchema.parse(options)

            const files = req.files as Record<string, Express.Multer.File[]>

            const images: Express.Multer.File = files.pdf?.[0] 

            const fileConfig: FileConfig | undefined = {
                tempDirPath: req.tempUploadDir,
                files: {
                    images: images,
                }
            }
            
            const mdxArticle = await this.mdxArticleService.createMDXArticle(validatedOptions, fileConfig)

            SendResponse(res, {
                cases: [
                    {
                        condition: () => true,
                        status: status.CREATED,
                        message: 'MDX Article created'
                    }
                ],
                data: mdxArticle
            })

        } catch (e) {
            SendError(res, e)
        }
    }

    async updateMDXArticle(req: Request, res: Response) {
        try {
            if (!req.tempUploadDir) {
                throw ApiError.Internal('Server has not prepared necessary dirs')
            }
            const { id, options }= JSON.parse(req.body.data)

            ValidateObjectFieldsNotNull(options)
            const validatedOptions = MDXArticleUpdateSchema.parse(options)

            const files = req.files as Record<string, Express.Multer.File[]>

            const images: Express.Multer.File = files.pdf?.[0] 

            const fileConfig: FileConfig | undefined = {
                tempDirPath: req.tempUploadDir,
                files: {
                    images: images,
                }
            }

            const mdxArticle = await this.mdxArticleService.updateArcticle(id, validatedOptions, fileConfig)

            SendResponse(res, {
                cases: [
                    {
                        condition: () => true,
                        status: status.OK,
                        message: 'MDX Article updated'
                    }
                ],
                data: mdxArticle
            })

            //status.OK, `MDXArticle updated`, mdxArticle
        } catch (e) {
            SendError(res, e)
        }
    }

    async bulkDeleteMDXArticles(req: Request, res: Response) {
        try {
            const ids = String(req.query.ids).split(',').map(Number)

            ValidateIdArray(ids)

            const { status } = await this.mdxArticleService.bulkDeleteMDXArticles(ids)

            SendResponse(res, {
                cases: [
                    {
                        condition: () => status === 200,
                        status: status,
                        message: 'MDX Articles deleted'
                    },
                    {
                        condition: () => status === 206,
                        status: status,
                        message: 'MDX Articles deleted partilly'
                    },
                    {
                        condition: () => true,
                        status: status,
                        message: 'MDX Articles were not deleted. Too much invalid data'
                    }
                ]
            })
            //status, status === 200 ? `MDXArticles deleted` : status === 206 ? `MDXArticles deleted partilly` : `MDXArticles weren't deleted. To much invalid data`, null
        } catch (e) {
            SendError(res, e)
        }
    }
}