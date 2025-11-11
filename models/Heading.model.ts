import { DataTypes, Model, Sequelize } from "sequelize";
import { MDXArticle } from "./MDXArticle.model.js";

export class Heading extends Model {
    declare id: number
    declare title: string
    declare mdxArticle_id: number

    static initialize(sequelize: Sequelize) {
        this.init({
            id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
            title: {type: DataTypes.STRING, allowNull: false },
            mdxArticle_id: { type: DataTypes.INTEGER, allowNull: false }
        }, {
            sequelize,
            modelName: 'Heading',
            tableName: 'heading',
            indexes: [
                {
                    unique: true,
                    fields: ['title', 'mdxArticle_id'],
                    name: 'unique_heading_per_mdxArticle'
                }
            ]
        })
    }

    static setupAssociations() {
        this.belongsTo(MDXArticle, {
            foreignKey: 'mdxArticle_id',
            onDelete: 'CASCADE',
            as: 'mdxArticle'
        })
    }
}