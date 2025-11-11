import { DataTypes, Model, Sequelize } from "sequelize";
import { MDXArticle } from "./MDXArticle.model.js";

export class MDXArticleFile extends Model {
    declare id: number;
    declare mdxArticle_id: number;

    declare path: string;
    declare originalName: string;

    static initialize(sequelize: Sequelize) {
        this.init({
            id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
            mdxArticle_id: { type: DataTypes.INTEGER, allowNull: false },
            path: { type: DataTypes.STRING, allowNull: false },
            originalName: { type: DataTypes.STRING, allowNull: false, unique: true }
        }, {
            sequelize,
            modelName: 'MDXArticleFile',
            tableName: 'mdxArticleFile'
        })
    }

    static setupAssociations() {
        this.belongsTo(MDXArticle, {
            foreignKey: 'mdxArticle_id',
            onDelete: 'CASCADE',
        })
    }
}