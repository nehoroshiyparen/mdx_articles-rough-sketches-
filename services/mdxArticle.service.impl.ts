import { inject, injectable } from "inversify";
import { Op, Sequelize, Transaction } from "sequelize";
import { redisIdPrefixes } from "#src/consts/index.js";
import { DatabaseImpl } from "#src/infrastructure/sequelize/database.impl.js";
import { MDXArticle } from "#src/infrastructure/sequelize/models/MDXArticle/MDXArticle.model.js";
import { Heading } from "#src/infrastructure/sequelize/models/MDXArticle/Heading.model.js";
import { TYPES } from "#src/di/types.js";
import { headingParser } from "../features/markdown/parsing/heading.parser.js";
import { MdxParser } from "../features/markdown/parsing/mdx.parser.js";
import { getSlug } from "#src/shared/slugging/getSlug.js";
import { RedisImpl } from "#src/infrastructure/redis/redis.impl.js";
import { IMDXArticleService } from "#src/types/contracts/services/mdxArticles/mdxArticle.service.interface.js";
import { MDXArticleContent } from "../interfaces/mdxArticles/MDXArticleContent.js";
import { MDXArticlePreview } from "../interfaces/mdxArticles/MDXArticlePreview.js";
import { TypeofMDXArticleFiltersSchema } from "../schemas/mdxArticle/MDXArticleFilters.schema.js";
import { TypeofAdvancedMDXArticleSchema } from "../schemas/mdxArticle/MDXArticlePatch.schema.js";
import { ApiError } from "#src/shared/ApiError/ApiError.js";
import { RethrowApiError } from "#src/shared/ApiError/RethrowApiError.js";
import { cleanup } from "#src/shared/utils/object.cleanup.js";
import { sanitizeMarkdownToText } from "#src/modules/mdxArticles/utils/sanitize/markdown.js";
import { TypeofMDXArticleUpdateSchema } from "../schemas/mdxArticle/MDXArticleUpdate.schema.js";
import { FileConfig } from "#src/types/interfaces/files/FileConfig.interface.js";
import { createDir } from "#src/shared/files/create/createDir.js";
import { moveFileToFinal } from "#src/shared/files/move/moveFileToFinal.js";
import { MDXArticleFile } from "#src/infrastructure/sequelize/models/MDXArticle/MDXArticleFiles.model.js";
import { removeFile } from "#src/shared/files/remove/removeFile.js";
import { generateUuid } from "#src/shared/crypto/generateUuid.js";
import { MDXArticleFileInfo } from "#src/types/interfaces/files/MDXArticleFileInfo.interface.js";
import { fileParser } from "../features/markdown/parsing/file.parser.js";
import { removeDir } from "#src/shared/files/remove/removeDir.js";
import { getRelativePath } from "#src/shared/files/utils/getRelativePath.js";

@injectable()
export class MDXArticleServiceImpl implements IMDXArticleService {
    private sequelize: Sequelize

    constructor(
        @inject(TYPES.Database) private database: DatabaseImpl,
        @inject(TYPES.Redis) private redis: RedisImpl,
    ) {
        this.sequelize = this.database.getDatabase()
    }

    async getMDXArticleById(id: number): Promise<MDXArticlePreview> {
        try {
            const mdxArticle = await MDXArticle.findByPk(
                id,
                {
                    attributes: [
                        'id', 
                        'title', 
                        'slug', 
                        'author_username', 
                        'event_start_date', 
                        'event_start_date'
                    ],
                    include: [
                        {
                            model: Heading,
                            as: 'headings',
                            attributes: ['id', 'title'],
                            limit: 5
                        }
                    ]
                }
            )

            if (!mdxArticle) throw ApiError.NotFound(`MDXArticle not found`)

            return mdxArticle
        } catch (e) {
            RethrowApiError(`Service error: Method - getMDXArticleById`, e)
        }
    }

    async getFilteredMDXArticles(filters: TypeofMDXArticleFiltersSchema): Promise<MDXArticlePreview[]> {
        try {
            const where: any = {}

            if (filters.title) {
                where.title = { [Op.iLike]: `%${filters.title}%` }
            }

            if (filters.author_username && filters.author_username !== 'Не указан') {
                where.author_username = { [Op.iLike]: `%${filters.author_username}%` }
            }

            if (filters.event_start_date) {
                where.event_start_date = { [Op.gte]: new Date(filters.event_start_date) }
            }

            if (filters.event_end_date) {
                where.event_end_date = { [Op.lte]: new Date(filters.event_end_date) }
            }

            if (Object.keys(where).length === 0) throw ApiError.BadRequest('Invalid filter params')

            const mdxArticles = await MDXArticle.findAll({
                where,
                attributes: [
                    'id', 
                    'title', 
                    'slug', 
                    'author_username', 
                    'event_start_date', 
                    'event_end_date'
                ],
                include: [
                    {
                        model: Heading,
                        as: 'headings',
                        attributes: ['id', 'title'],
                        limit: 5
                    }
                ]
            })

            return mdxArticles
        } catch (e) {
            RethrowApiError(`Service error: Method - getFilteredMDXArticles`, e)
        }
    }

    async searchMDXArticleByContent(content: string) {
        try {
            const cleanedContent = sanitizeMarkdownToText(content)

            if (!cleanedContent) throw ApiError.BadRequest(`Invalid content`)

            const mdxArticle = await MDXArticle.findOne({
                where: { content_markdown: { [Op.iLike]: `%${cleanedContent}%` } },
                attributes: ['id', 'title', 'slug', 'author_username', 'event_start_date', 'event_end_date']
            })

            if (!mdxArticle) throw ApiError.NotFound("MDXArticle not found")

            const key = this.redis.joinKeys([redisIdPrefixes.content_html, `${mdxArticle.id}`])
            const cachedHtml = await this.redis.getValue(key)

            if (!cachedHtml) throw ApiError.NotFound(`Content for this mdxArticle was not found`)

            return {
                mdxArticle,
                content_html: cachedHtml,
            }
        } catch (e) {
            RethrowApiError(`Service error: Method - searchMDXArticleByContent`, e)
        }
    }

    async getMDXArticleContent(id: number): Promise<MDXArticleContent> {
        try {
            const mdxArticle = await MDXArticle.findByPk(id, {
                attributes: [],
                include: [
                    {
                        model: Heading,
                        as: 'headings',
                        attributes: ['id', 'title'],
                    }
                ]
            })
    
            if (!mdxArticle) throw ApiError.NotFound(`MDXArticle with id: ${id}, not found`)
    
            const key = this.redis.joinKeys([redisIdPrefixes.content_html, `${id}`])
            const content_html = await this.redis.getValue(key)
    
            if (!content_html) throw ApiError.NotFound(`Content for mdxArticle with id ${id} not found`)
    
            return { content_html, headings: mdxArticle.headings ?? [] }
        } catch (e) {
            RethrowApiError(`Service error: Method - getMDXArticleContent`, e)
        }
    }

    async createMDXArticle(options: TypeofAdvancedMDXArticleSchema, fileConfig: FileConfig | undefined): Promise<MDXArticle> {
        const transaction = await this.sequelize.transaction()
        try {
            const mdxArticle = await this._createMDXArticleRecord(options, transaction)
            const extractedFiles: string[] = fileParser(options.content_markdown)
            const savedFiles = fileConfig ? await this._processFiles(fileConfig, mdxArticle.id, extractedFiles, transaction) : []
            const contentHtml = await this._renderMarkdownWithFiles(options.content_markdown, savedFiles)

            await this._createHeadings(options, mdxArticle.id, transaction)
            await this._cacheHtml(mdxArticle.id, contentHtml)

            await transaction.commit()
            return mdxArticle
        } catch (e) {
            await transaction.rollback()
            RethrowApiError(`Service error: Method - createMDXArticle`, e)
        }
    }


    //нужно предусмотреть ситуацию, когда файл будет указан в разметке, но не прикреплен. Такой нужно удалять из разметки
    async updateArcticle(
        id: number,
        options: TypeofMDXArticleUpdateSchema,
        fileConfig: FileConfig | undefined
    ): Promise<{ mdxArticle: MDXArticle, headings: Heading[] | null }> {
    const transaction = await this.sequelize.transaction();
    try {
        const mdxArticle = await this._findMDXArticleWithFiles(id);
        const updateData = this._prepareUpdateData(options, mdxArticle);
        
        if (Object.keys(updateData).length) {
            await MDXArticle.update(updateData, { where: { id }, transaction });
        }

        const extractedFiles = fileParser(options.content_markdown ?? mdxArticle.content_markdown);
        
        if (options.files?.delete?.length) {
            await this._deleteFiles(options.files.delete, transaction);
        }

        const savedFiles = fileConfig
            ? await this._processFiles(fileConfig, id, extractedFiles, transaction)
            : [];

        const filesForMarkdown = this._getFilesForMarkdown(mdxArticle.files || [], options);
        savedFiles.push(...filesForMarkdown);

        if (options.content_markdown) {
            const contentHtml = await MdxParser(options.content_markdown, savedFiles);
            await this._cacheHtml(mdxArticle.id, contentHtml);

            const processedHeadings = headingParser(options.content_markdown);
            options.headings?.push(...processedHeadings.map(h => ({ title: h })));
        }

        if (options.headings || options.content_markdown) {
            await this._updateHeadings(mdxArticle.id, options.headings ?? [], transaction);
        }

        await mdxArticle.reload({ transaction });
        await transaction.commit();

        const newHeadings = await this._getMDXArticleHeadings(id);
        return { mdxArticle, headings: newHeadings };
    } catch (e) {
        await transaction.rollback();
        RethrowApiError(`Service error: Method - updateArcticle`, e);
    }
    }

    async bulkDeleteMDXArticles(ids: number[]): Promise<{ status: number }> {
        const errorLimit = Math.max(Math.floor(ids.length / 2), 1);
        let errorCounter = 0;
    
        try {
           for (const id of ids) {
                try {
                    if (errorCounter >= errorLimit) break
                    
                    const mdxArticle = await MDXArticle.findByPk(id)
                    if (!mdxArticle) throw ApiError.NotFound(`MDXArticle with id: ${id} do not exists`)

                    await this.sequelize.transaction(async (t) => {
                        await MDXArticle.destroy({
                            where: { id },
                            transaction: t
                        })
                    })

                    this._deleteRedisValue(id)
                } catch (e) {
                    errorCounter++
                    console.log(`Error while deleting mdxArticle with id: ${id} \n Error: ${e}`)
                }
           }
    
            if (errorCounter > 0 && errorCounter < errorLimit) {
                return { status: 206 };
            } else if (errorCounter >= errorLimit) {
                return { status: 400 };
            }
    
            return { status: 200 };
        } catch (e) {
            throw RethrowApiError(`Service error: Method - bulkDeleteMDXArticles`, e);
        }
    }

    private async _createMDXArticleRecord(
        options: TypeofAdvancedMDXArticleSchema,
        transaction: Transaction
    ): Promise<MDXArticle> {
        const { content_markdown, headings, ...mdxArticleOpt } = options
        const slug = getSlug(mdxArticleOpt.title)

        return await MDXArticle.create({
            ...mdxArticleOpt,
            slug,
            content_markdown
        }, { transaction })
    }

    private async _createHeadings(
        options: TypeofAdvancedMDXArticleSchema,
        mdxArticleId: number,
        transaction: Transaction
    ) {
        const processedHeadings = headingParser(options.content_markdown)
        options.headings?.forEach(h => processedHeadings.push(h.title))
        processedHeadings.push(options.title)

        await Promise.all(
            processedHeadings.map(h => Heading.create({ title: h, mdxArticle_id: mdxArticleId }, { transaction }))
        )
    }

        /**
     * 
     * @param id - MDXArticle ID
     * @param headings - New headings
     * @param transaction - Sequelize transaction
    */
    private async _updateHeadings(
        id: number, 
        headings: { title: string }[], 
        transaction?: Transaction
    ): Promise<void> {
        const existingHeadings = await MDXArticle.findByPk(id, {
            attributes: [],
            include: [
                {
                    model: Heading,
                    as: 'headings',
                    attributes: ['id', 'title'],
                }
            ]
        })

        const newHeadings = headings.map(h => h.title)
        const existingHeadingsTitles = existingHeadings?.headings?.map(h => h.title) ?? []

        const headingsToDelete = existingHeadingsTitles.filter(t => !newHeadings.includes(t))
        const headingsToLeave = existingHeadingsTitles.filter(t => newHeadings.includes(t))
        const headingsToCreate = newHeadings.filter(heading => !headingsToLeave.some(h => h === heading))

        await Promise.all(
            headingsToDelete.map(heading => {
                return Heading.destroy({
                    where: {
                        title: heading
                    }, transaction
                })
            }) ?? []
        )

        await Promise.all(
            headingsToCreate.map(heading => {
                return Heading.create({
                    title: heading,
                    mdxArticle_id: id
                }, { transaction })
            }) ?? []
        )
    }

    private async _processFiles(fileConfig: FileConfig, mdxArticleId: number, extractedFiles: string[], transaction: Transaction): Promise<MDXArticleFileInfo[]> {
        const dirpath = createDir(String(mdxArticleId))
        const savedFiles: MDXArticleFileInfo[] = []

        // for (const file of fileConfig.files || []) {
        //     if (!extractedFiles.some(f => f.toLowerCase() === file.filename.toLowerCase())) continue
        //     const uuid = generateUuid()
        //     try {
        //         const filepath = fileConfig ? moveFileToFinal(fileConfig.tempDirPath, file.filename, `mdxArticles/${mdxArticleId}`, uuid) : null
        //         const image_url = filepath ? getRelativePath(filepath, 'mdxArticles') : undefined

        //         await MDXArticleFile.create({
        //             mdxArticle_id: mdxArticleId,
        //             path: image_url,
        //             originalName: file.filename
        //         }, { transaction })

        //         savedFiles.push({ originalName: file.filename, path: filepath! })
        //         console.log(savedFiles)
        //     } catch (e) {
        //         console.log(`File ${file.filename} was removed`, e)
        //         removeFile(uuid, dirpath)
        //     }
        // }

        removeDir(fileConfig.tempDirPath)

        return savedFiles
    }

    private async _renderMarkdownWithFiles(markdown: string, savedFiles: MDXArticleFileInfo[]): Promise<string> {
        return await MdxParser(markdown, savedFiles)
    }

    private async _deleteRedisValue(mdxArticleId: number) {
        const key = this.redis.joinKeys([redisIdPrefixes.content_html, `${mdxArticleId}`])
        await this.redis.deleteValue(key)
    }

    private async _cacheHtml(mdxArticleId: number, html: string) {
        const key = this.redis.joinKeys([redisIdPrefixes.content_html, `${mdxArticleId}`])
        await this.redis.setValue(key, html)
    }

    private async _findMDXArticleWithFiles(id: number) {
        const mdxArticle = await MDXArticle.findByPk(id, {
            include: [{ model: MDXArticleFile, as: 'files', attributes: ['id', 'path', 'originalName'] }]
        });
        if (!mdxArticle) throw ApiError.NotFound(`MDXArticle with id: ${id} not found`);
        return mdxArticle;
    }

    private _prepareUpdateData(options: TypeofMDXArticleUpdateSchema, mdxArticle: MDXArticle) {
        const { content_markdown, headings, ...mdxArticleOpt } = options;
        const slug = options.title ? getSlug(options.title) : undefined;
        headings?.push({ title: options.title ?? mdxArticle.title });
        return cleanup({ ...mdxArticleOpt, slug, content_markdown });
    }

    private async _deleteFiles(fileIds: number[], transaction: any) {
        for (const id of fileIds) {
            const file = await MDXArticleFile.findByPk(id);
            if (!file) continue;
            await MDXArticleFile.destroy({ where: { id }, transaction });
            removeFile('', '', file.path);
        }
    }

    private _getFilesForMarkdown(files: MDXArticleFile[], options: TypeofMDXArticleUpdateSchema): MDXArticleFileInfo[] {
        return files
            .filter(f => !options.files?.delete?.includes(f.id))
            .map(f => ({ path: f.path, originalName: f.originalName }));
    }

    private async _getMDXArticleHeadings(id: number) {
        const result = await MDXArticle.findByPk(id, {
            attributes: [],
            include: [{ model: Heading, as: 'headings', attributes: ['id', 'title'] }]
        });
        return result?.headings ?? null;
    }
}