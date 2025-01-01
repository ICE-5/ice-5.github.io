module Jekyll
  class DynamicDataPageGenerator < Generator
    safe true

    def generate(site)
      # Check if portfolio data exists
      if site.data['portfolio']
        projects = site.data['portfolio']['projects']

        projects.each do |project|
          # Populate the 'images' key
          folder_path = File.join(site.source, project['image_folder'])
          if Dir.exist?(folder_path)
            project['images'] = Dir.glob(File.join(folder_path, "*.{jpg,png,gif,jpeg}"))
                                   .sort
                                   .map { |path| path.sub(site.source, "") }
          else
            project['images'] = []
          end

          # Log generated images for debugging
          # puts "Project: #{project['title']}"
          # puts "Images: #{project['images'].join(', ')}"

          # Generate the page
          site.pages << DataPage.new(site, site.source, project)
        end
      end
    end
  end

  class DataPage < Page
    def initialize(site, base, project)
      @site = site
      @base = base
      @dir = project['permalink']
      @name = "index.html"

      self.process(@name)
      self.read_yaml(File.join(base, '_layouts'), 'project-design.html')
      self.data['title'] = project['title']
      self.data['description'] = project['description']
      self.data['image_folder'] = project['image_folder']
      self.data['cover'] = project['cover']
      self.data['studio'] = project['studio']
      self.data['designer'] = project['designer']
      self.data['images'] = project['images']

      # Log the data for debugging
      # puts "Generated DataPage for: #{project['title']}"
    end
  end
end